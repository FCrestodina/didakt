"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Mic, RotateCcw, Trash2, X } from "lucide-react";
import { RobotMensajero, type LuzEstado } from "@/components/stem/RobotMensajero";
import { TableroSvg, describirTablero } from "@/components/stem/TableroSvg";
import { ejecutarSecuencia } from "@/lib/stem/grid/motor";
import { ETIQUETA_ACCION, type Estado, type ResultadoEjecucion } from "@/lib/stem/grid/tipos";
import { interpretar, type Interpretacion } from "@/lib/stem/robot/interprete";
import {
  MENSAJE_CAPTURA,
  MENSAJE_LISTO,
  MENSAJE_PROCESANDO,
  clasificacionParaRegistro,
  componerMensaje,
  mensajeFallaDeVoz,
  resultadoParaRegistro,
  type MensajeEstado,
} from "@/lib/stem/robot/mensajes";
import { MISIONES, misionPorId } from "@/lib/stem/robot/misiones";
import { useReconocimientoDeVoz, type FallaVoz } from "@/lib/stem/robot/voz";
import { cn } from "@/lib/stem/cn";

/** Un renglón del registro temporal de la sesión (sección 11 del manual). */
interface Intento {
  numero: number;
  mision: number;
  entrada: string;
  clasificacion: string;
  resultado: string;
  detalle: string;
}

/** Milisegundos entre paso y paso de la animación. */
const MS_POR_PASO = 340;

export default function PaginaRobot() {
  const [misionId, setMisionId] = useState(1);
  const mision = useMemo(() => misionPorId(misionId), [misionId]);

  const [estado, setEstado] = useState<Estado>(mision.inicio);
  const [mensaje, setMensaje] = useState<MensajeEstado>(MENSAJE_LISTO);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [entradaTexto, setEntradaTexto] = useState("");
  const [mostrarEscritura, setMostrarEscritura] = useState(false);
  const [mostrarRepertorio, setMostrarRepertorio] = useState(
    mision.mostrarRepertorioPorDefecto,
  );
  const [mostrarPanelDocente, setMostrarPanelDocente] = useState(false);
  const [sonido, setSonido] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [cumplida, setCumplida] = useState(false);

  // El estado actual se lee desde los callbacks del reconocimiento de voz, que
  // se crean una sola vez: sin ref quedaría congelado en la posición inicial.
  // La copia se hace después del commit, y solo se lee desde manejadores de
  // eventos, que siempre corren más tarde.
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);
  const contadorRef = useRef(0);
  const temporizadoresRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpiarTemporizadores = useCallback(() => {
    temporizadoresRef.current.forEach(clearTimeout);
    temporizadoresRef.current = [];
  }, []);

  useEffect(() => limpiarTemporizadores, [limpiarTemporizadores]);

  /** Tono neutro opcional. Nunca es la única señal: el panel siempre lo dice en texto. */
  const sonar = useCallback(
    (frecuencia: number) => {
      if (!sonido || typeof window === "undefined") return;
      try {
        const contexto = new AudioContext();
        const oscilador = contexto.createOscillator();
        const volumen = contexto.createGain();
        oscilador.frequency.value = frecuencia;
        volumen.gain.value = 0.05;
        oscilador.connect(volumen).connect(contexto.destination);
        oscilador.start();
        oscilador.stop(contexto.currentTime + 0.12);
        oscilador.onended = () => void contexto.close();
      } catch {
        // Si el navegador bloquea el audio, la interfaz sigue funcionando igual.
      }
    },
    [sonido],
  );

  const registrar = useCallback(
    (entrada: string, interpretacion: Interpretacion, resultadoTexto: string, detalle: string) => {
      contadorRef.current += 1;
      setIntentos((previos) => [
        ...previos,
        {
          numero: contadorRef.current,
          mision: misionId,
          entrada: entrada.trim() || "(sin transcripción)",
          clasificacion: clasificacionParaRegistro(interpretacion),
          resultado: resultadoTexto,
          detalle,
        },
      ]);
    },
    [misionId],
  );

  /** Recorre la traza del motor mostrando un casillero por vez. */
  const animar = useCallback(
    (resultado: ResultadoEjecucion, alTerminar: () => void) => {
      const aplicados = resultado.pasos.filter((p) => p.aplicada);
      if (aplicados.length === 0) {
        alTerminar();
        return;
      }
      setEjecutando(true);
      aplicados.forEach((paso, i) => {
        const id = setTimeout(() => {
          setEstado(paso.estadoPosterior);
          if (i === aplicados.length - 1) {
            setEjecutando(false);
            alTerminar();
          }
        }, MS_POR_PASO * (i + 1));
        temporizadoresRef.current.push(id);
      });
    },
    [],
  );

  /**
   * Punto único por el que pasan la voz transcripta y la entrada escrita.
   * Las dos vías producen exactamente el mismo resultado semántico.
   */
  const procesarEntrada = useCallback(
    (entrada: string) => {
      const misionActual = misionPorId(misionId);
      const interpretacion = interpretar(entrada);

      if (interpretacion.tipo !== "EJECUTABLE") {
        const msg = componerMensaje(entrada, interpretacion, null);
        setMensaje(msg);
        registrar(entrada, interpretacion, resultadoParaRegistro(interpretacion, null), msg.detalle);
        sonar(320);
        return;
      }

      const resultado = ejecutarSecuencia(
        misionActual.tablero,
        estadoRef.current,
        misionActual.destino,
        interpretacion.acciones,
      );

      // El mensaje se muestra recién cuando terminó la animación, para que el
      // recorrido se pueda seguir a simple vista antes de leer el resultado.
      animar(resultado, () => {
        const msg = componerMensaje(entrada, interpretacion, resultado);
        setMensaje(msg);
        setEstado(resultado.estadoFinal);
        if (resultado.motivo === "META_ALCANZADA") {
          setCumplida(true);
          sonar(660);
        } else {
          sonar(resultado.indiceBloqueo !== null ? 320 : 480);
        }
        registrar(
          entrada,
          interpretacion,
          resultadoParaRegistro(interpretacion, resultado),
          msg.detalle,
        );
      });
    },
    [animar, misionId, registrar, sonar],
  );

  const alFallarVoz = useCallback(
    (falla: FallaVoz) => {
      const msg = mensajeFallaDeVoz(falla);
      setMensaje(msg);
      contadorRef.current += 1;
      setIntentos((previos) => [
        ...previos,
        {
          numero: contadorRef.current,
          mision: misionId,
          entrada: "(sin transcripción)",
          clasificacion: "Falla de reconocimiento",
          resultado: "Sin movimiento",
          detalle: msg.detalle,
        },
      ]);
      if (falla === "SIN_SOPORTE" || falla === "PERMISO_DENEGADO") {
        setMostrarEscritura(true);
      }
    },
    [misionId],
  );

  const alTranscribir = useCallback(
    ({ transcripcion }: { transcripcion: string }) => {
      procesarEntrada(transcripcion);
    },
    [procesarEntrada],
  );

  const voz = useReconocimientoDeVoz({
    onTranscripcion: alTranscribir,
    onFalla: alFallarVoz,
  });

  // Mientras dura la captura, el panel muestra el estado técnico del micrófono.
  // Es un valor derivado: no hace falta guardarlo aparte ni sincronizarlo.
  const mensajeMostrado: MensajeEstado =
    voz.estado === "capturando"
      ? MENSAJE_CAPTURA
      : voz.estado === "procesando"
        ? MENSAJE_PROCESANDO
        : mensaje;

  const reiniciarPosicion = useCallback(() => {
    limpiarTemporizadores();
    setEjecutando(false);
    setEstado(misionPorId(misionId).inicio);
    setCumplida(false);
    setMensaje(MENSAJE_LISTO);
  }, [limpiarTemporizadores, misionId]);

  const cambiarMision = useCallback(
    (id: number) => {
      limpiarTemporizadores();
      setEjecutando(false);
      setMisionId(id);
      setEstado(misionPorId(id).inicio);
      setCumplida(false);
      setMensaje(MENSAJE_LISTO);
      setMostrarRepertorio(misionPorId(id).mostrarRepertorioPorDefecto);
    },
    [limpiarTemporizadores],
  );

  const luz: LuzEstado = ejecutando
    ? "movimiento"
    : voz.estado === "capturando"
      ? "captura"
      : voz.estado === "procesando"
        ? "procesando"
        : mensaje.tono === "atencion"
          ? "bloqueada"
          : "inactiva";

  const ocupado = ejecutando || voz.estado !== "inactivo";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Robot mensajero</h1>
          <p className="text-sm text-gray-600">
            Misión {mision.id} · {mision.titulo} — entregar el sobre en {mision.nombreDestino.toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarPanelDocente(true)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Docente
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Escenario" className="rounded-xl border border-gray-200 bg-white p-4">
          <TableroSvg
            tablero={mision.tablero}
            estado={estado}
            destino={mision.destino}
            pieza={<RobotMensajero luz={luz} llevaSobre />}
            descripcionAccesible={describirTablero(
              mision.tablero,
              estado,
              mision.destino,
              mision.nombreDestino,
            )}
            className="mx-auto block h-auto w-full max-w-[560px]"
          />

          {/* Referencia del escenario. Cada elemento se nombra en texto: la
              lectura del tablero no depende solo de las formas ni del color. */}
          <ul className="mx-auto mt-4 flex max-w-[560px] flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-4 w-4 rounded border-2 border-dashed border-blue-600 bg-blue-50" />
              Destino: {mision.nombreDestino}
            </li>
            {mision.tablero.obstaculos.length > 0 && (
              <li className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-4 w-4 rounded border-2 border-gray-800 bg-gray-600" />
                {mision.tablero.obstaculos.length === 1
                  ? "1 obstáculo"
                  : `${mision.tablero.obstaculos.length} obstáculos`}
              </li>
            )}
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-4 w-4 rounded border-2 border-gray-500 bg-gray-200" />
              Dispositivo mensajero con el sobre
            </li>
          </ul>
        </section>

        <div className="flex flex-col gap-4">
          {/* Panel neutro de estado. Nunca hay burbujas de diálogo del robot. */}
          <section
            aria-label="Estado de la instrucción"
            className={cn(
              "rounded-xl border-2 bg-white p-4",
              mensajeMostrado.tono === "logro"
                ? "border-green-600"
                : mensajeMostrado.tono === "atencion"
                  ? "border-amber-500"
                  : "border-gray-300",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estado de la instrucción · {mensajeMostrado.etiquetaTono}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">{mensajeMostrado.titulo}</p>
            <div aria-live="polite" className="mt-2 space-y-1">
              {mensajeMostrado.transcripcion && (
                <p className="text-base text-gray-800">{mensajeMostrado.transcripcion}</p>
              )}
              <p className="text-base text-gray-700">{mensajeMostrado.detalle}</p>
            </div>
          </section>

          <section aria-label="Dar una instrucción" className="rounded-xl border border-gray-200 bg-white p-4">
            <button
              type="button"
              onClick={voz.capturar}
              disabled={ocupado || cumplida}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-xl px-4 py-5 text-lg font-bold text-white",
                "bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-300",
                "disabled:bg-gray-400",
              )}
            >
              <Mic aria-hidden className="h-7 w-7" />
              {voz.estado === "capturando" ? "Micrófono activo" : "Activar micrófono"}
            </button>

            {!voz.soportado && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Este navegador no ofrece reconocimiento de voz. Escribí la instrucción.
              </p>
            )}

            <button
              type="button"
              onClick={() => setMostrarEscritura((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
              aria-expanded={mostrarEscritura}
            >
              <Keyboard aria-hidden className="h-5 w-5" />
              Escribir instrucción
            </button>

            {mostrarEscritura && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (ocupado || cumplida) return;
                  procesarEntrada(entradaTexto);
                  setEntradaTexto("");
                }}
              >
                <label htmlFor="instruccion" className="sr-only">
                  Instrucción escrita
                </label>
                <input
                  id="instruccion"
                  value={entradaTexto}
                  onChange={(e) => setEntradaTexto(e.target.value)}
                  placeholder="Por ejemplo: avanzá dos casilleros"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-base"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={ocupado || cumplida}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Probar
                </button>
              </form>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={reiniciarPosicion}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                Reiniciar posición
              </button>
            </div>

            {cumplida && (
              <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-900">
                Destino alcanzado. Para volver a intentarlo, usá «Reiniciar posición».
              </p>
            )}
          </section>

          {/* Repertorio oculto durante el diagnóstico: se habilita desde el panel docente. */}
          {mostrarRepertorio && (
            <section aria-label="Repertorio de acciones" className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Acciones previstas en este sistema
              </h2>
              <ul className="mt-2 space-y-1 text-base text-gray-800">
                <li>{ETIQUETA_ACCION.AVANZAR} (de 1 a 5 casilleros)</li>
                <li>{ETIQUETA_ACCION.GIRO_DERECHA_90}</li>
                <li>{ETIQUETA_ACCION.GIRO_IZQUIERDA_90}</li>
                <li>{ETIQUETA_ACCION.DETENER}</li>
              </ul>
            </section>
          )}
        </div>
      </div>

      {mostrarPanelDocente && (
        <PanelDocente
          misionId={misionId}
          intentos={intentos}
          mostrarRepertorio={mostrarRepertorio}
          sonido={sonido}
          onCerrar={() => setMostrarPanelDocente(false)}
          onCambiarMision={cambiarMision}
          onReiniciarPosicion={reiniciarPosicion}
          onAlternarRepertorio={() => setMostrarRepertorio((v) => !v)}
          onAlternarSonido={() => setSonido((v) => !v)}
          onBorrarHistorial={() => {
            setIntentos([]);
            contadorRef.current = 0;
          }}
        />
      )}
    </main>
  );
}

/**
 * Funciones docentes. No ocupan la pantalla principal ni quedan visibles como
 * comandos para los estudiantes durante el diagnóstico (sección 17 del manual).
 */
function PanelDocente({
  misionId,
  intentos,
  mostrarRepertorio,
  sonido,
  onCerrar,
  onCambiarMision,
  onReiniciarPosicion,
  onAlternarRepertorio,
  onAlternarSonido,
  onBorrarHistorial,
}: {
  misionId: number;
  intentos: Intento[];
  mostrarRepertorio: boolean;
  sonido: boolean;
  onCerrar: () => void;
  onCambiarMision: (id: number) => void;
  onReiniciarPosicion: () => void;
  onAlternarRepertorio: () => void;
  onAlternarSonido: () => void;
  onBorrarHistorial: () => void;
}) {
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-gray-900/40" role="dialog" aria-label="Panel docente">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Panel docente</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Cerrar panel docente"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Misión</h3>
          <div className="space-y-2">
            {MISIONES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onCambiarMision(m.id)}
                aria-pressed={m.id === misionId}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left",
                  m.id === misionId
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50",
                )}
              >
                <span className="block font-semibold text-gray-900">
                  {m.id}. {m.titulo}
                  {m.id === misionId && " · en curso"}
                </span>
                <span className="block text-sm text-gray-600">{m.propositoDidactico}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5 space-y-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Controles</h3>
          <button
            type="button"
            onClick={onReiniciarPosicion}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left font-medium text-gray-800 hover:bg-gray-50"
          >
            Reiniciar posición del dispositivo
            <span className="block text-sm font-normal text-gray-600">
              Vuelve a la salida sin borrar el registro de la sesión.
            </span>
          </button>
          <button
            type="button"
            onClick={onAlternarRepertorio}
            aria-pressed={mostrarRepertorio}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left font-medium text-gray-800 hover:bg-gray-50"
          >
            Mostrar repertorio de acciones: {mostrarRepertorio ? "activado" : "desactivado"}
            <span className="block text-sm font-normal text-gray-600">
              Mantenerlo desactivado durante la misión diagnóstica.
            </span>
          </button>
          <button
            type="button"
            onClick={onAlternarSonido}
            aria-pressed={sonido}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left font-medium text-gray-800 hover:bg-gray-50"
          >
            Sonido de confirmación: {sonido ? "activado" : "desactivado"}
            <span className="block text-sm font-normal text-gray-600">
              Tono neutro. Nunca reemplaza al texto del panel de estado.
            </span>
          </button>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Registro de la sesión ({intentos.length})
            </h3>
            <button
              type="button"
              onClick={onBorrarHistorial}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Borrar historial
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-600">
            Sirve para recuperar ejemplos en la puesta en común. No guarda nombres ni audio, y se
            borra al recargar la aplicación.
          </p>

          {intentos.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Todavía no hay intentos registrados en esta sesión.
            </p>
          ) : (
            <ol className="space-y-2">
              {intentos
                .slice()
                .reverse()
                .map((intento) => (
                  <li key={intento.numero} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Intento {intento.numero} · Misión {intento.mision}
                    </p>
                    <p className="text-base text-gray-800">“{intento.entrada}”</p>
                    <p className="text-sm text-gray-600">
                      {intento.clasificacion} · {intento.resultado}
                    </p>
                    <p className="text-sm text-gray-600">{intento.detalle}</p>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
