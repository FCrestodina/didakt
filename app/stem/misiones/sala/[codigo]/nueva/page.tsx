"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { BancoDeSimbolos, ListaSecuencia } from "@/components/stem/ConstructorSecuencia";
import { MiniaturaPieza, PiezaObjetoMeta, PiezaPersonaje } from "@/components/stem/piezasMision";
import { TableroSvg, describirTablero } from "@/components/stem/TableroSvg";
import { ejecutarSecuencia } from "@/lib/stem/grid/motor";
import {
  NOMBRE_ORIENTACION,
  ORIENTACIONES,
  type Accion,
  type Celda,
  type Orientacion,
  type ResultadoEjecucion,
} from "@/lib/stem/grid/tipos";
import { OBJETOS_META, PERSONAJES } from "@/lib/stem/misiones/catalogo";
import { mensajeDeEjecucion, type MensajeResultado } from "@/lib/stem/misiones/mensajes";
import { ESCENARIOS, escenarioPorId } from "@/lib/stem/misiones/tableros";
import type { CodigoClase } from "@/lib/stem/misiones/trazos";
import { MAX_ACCIONES, validarConfiguracion } from "@/lib/stem/misiones/validacion";
import { cn } from "@/lib/stem/cn";

/**
 * Módulo B · Crear una misión.
 *
 * El editor es muy guiado: una decisión principal por pantalla. La autoría se
 * concentra en el problema lógico que propone el grupo, no en configurar
 * aspectos técnicos.
 *
 * No se puede guardar una misión sin al menos una secuencia comprobada que
 * llegue a la meta.
 */

type Paso = "escenario" | "piezas" | "ubicaciones" | "secuencia";

const PASOS: { id: Paso; titulo: string; consigna: string }[] = [
  { id: "escenario", titulo: "Escenario", consigna: "Elegí un escenario para tu misión." },
  { id: "piezas", titulo: "Personaje y meta", consigna: "Elegí quién se mueve y a dónde tiene que llegar." },
  { id: "ubicaciones", titulo: "Salida y meta", consigna: "Ubicá el punto de partida, hacia dónde mira y dónde está la meta." },
  { id: "secuencia", titulo: "Secuencia", consigna: "Usá los símbolos del código para indicar el recorrido." },
];

const MS_POR_PASO = 380;

export default function PaginaNuevaMision({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const router = useRouter();

  const [simbolos, setSimbolos] = useState<CodigoClase | null>(null);
  const [carga, setCarga] = useState<"cargando" | "lista" | "noExiste">("cargando");

  const [paso, setPaso] = useState<Paso>("escenario");
  const [escenarioId, setEscenarioId] = useState(1);
  const [personaje, setPersonaje] = useState(PERSONAJES[0].id);
  const [objetoMeta, setObjetoMeta] = useState(OBJETOS_META[0].id);
  const [salida, setSalida] = useState<Celda | null>(null);
  const [orientacion, setOrientacion] = useState<Orientacion>("NORTE");
  const [meta, setMeta] = useState<Celda | null>(null);
  const [colocando, setColocando] = useState<"salida" | "meta">("salida");

  const [secuencia, setSecuencia] = useState<Accion[]>([]);
  const [posicionAnimada, setPosicionAnimada] = useState<{ celda: Celda; orientacion: Orientacion } | null>(null);
  const [indiceEnCurso, setIndiceEnCurso] = useState<number | null>(null);
  const [resultado, setResultado] = useState<MensajeResultado | null>(null);
  const [resuelta, setResuelta] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  const temporizadoresRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const limpiarTemporizadores = useCallback(() => {
    temporizadoresRef.current.forEach(clearTimeout);
    temporizadoresRef.current = [];
  }, []);
  useEffect(() => limpiarTemporizadores, [limpiarTemporizadores]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const respuesta = await fetch(`/api/salas/creacion/${codigo}`);
      if (cancelado) return;
      if (!respuesta.ok) {
        setCarga("noExiste");
        return;
      }
      const sala = await respuesta.json();
      setSimbolos(sala.simbolos);
      setCarga("lista");
    })();
    return () => {
      cancelado = true;
    };
  }, [codigo]);

  const escenario = escenarioPorId(escenarioId);

  const problemas =
    salida && meta
      ? validarConfiguracion({ escenarioId, personaje, objetoMeta, salida, orientacion, meta })
      : [];
  const ubicacionesListas = Boolean(salida && meta && problemas.length === 0);

  /** Cualquier cambio de la misión invalida la comprobación anterior. */
  const reiniciarComprobacion = useCallback(() => {
    limpiarTemporizadores();
    setEjecutando(false);
    setPosicionAnimada(null);
    setIndiceEnCurso(null);
    setResultado(null);
    setResuelta(false);
  }, [limpiarTemporizadores]);

  const alTocarCelda = (celda: Celda) => {
    reiniciarComprobacion();
    if (colocando === "salida") {
      setSalida(celda);
      setColocando("meta");
    } else {
      setMeta(celda);
      setColocando("salida");
    }
  };

  const probar = () => {
    if (!salida || !meta || secuencia.length === 0) return;
    reiniciarComprobacion();

    const ejecucion: ResultadoEjecucion = ejecutarSecuencia(
      escenario.tablero,
      { celda: salida, orientacion },
      meta,
      secuencia,
    );

    setEjecutando(true);
    setPosicionAnimada({ celda: salida, orientacion });

    // Se recorre paso a paso, incluida la acción bloqueada: así se ve dónde
    // se detiene la ejecución y por qué.
    ejecucion.pasos.forEach((p, i) => {
      const id = setTimeout(() => {
        setIndiceEnCurso(p.indice);
        setPosicionAnimada(p.estadoPosterior);
        if (i === ejecucion.pasos.length - 1) {
          const mensaje = mensajeDeEjecucion(ejecucion);
          setResultado(mensaje);
          setResuelta(ejecucion.exito);
          setEjecutando(false);
          setIndiceEnCurso(null);
        }
      }, MS_POR_PASO * (i + 1));
      temporizadoresRef.current.push(id);
    });

    if (ejecucion.pasos.length === 0) {
      const mensaje = mensajeDeEjecucion(ejecucion);
      setResultado(mensaje);
      setResuelta(ejecucion.exito);
      setEjecutando(false);
    }
  };

  const guardar = async () => {
    if (!salida || !meta || !resuelta) return;
    setGuardando(true);
    setErrorGuardado(null);
    try {
      const respuesta = await fetch(`/api/salas/creacion/${codigo}/misiones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escenarioId,
          personaje,
          objetoMeta,
          salida,
          orientacion,
          meta,
          secuencia,
        }),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => null);
        setErrorGuardado(
          cuerpo?.problemas?.[0]?.mensaje ??
            cuerpo?.error ??
            "No se pudo guardar la misión. Probá de nuevo.",
        );
        return;
      }
      router.push(`/stem/misiones/sala/${codigo}`);
    } catch {
      setErrorGuardado("No se pudo conectar. Revisá la conexión y probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (carga === "cargando") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-gray-600">Abriendo la sala…</p>
      </main>
    );
  }
  if (carga === "noExiste" || !simbolos) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">No encontramos esa sala</h1>
        <p className="mt-2 text-gray-600">
          El código de creación puede estar mal escrito, o la sala ya caducó.
        </p>
        <Link
          href="/stem/misiones"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

  const consigna = PASOS.find((p) => p.id === paso)!.consigna;
  const estadoTablero = posicionAnimada ?? (salida ? { celda: salida, orientacion } : null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/stem/misiones/sala/${codigo}`}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Volver a la sala
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Crear una misión</h1>

      {/* Una decisión principal por pantalla. */}
      <ol className="mt-3 flex flex-wrap gap-2" aria-label="Pasos para crear la misión">
        {PASOS.map((p, i) => {
          const habilitado =
            p.id === "escenario" ||
            p.id === "piezas" ||
            (p.id === "ubicaciones" && true) ||
            (p.id === "secuencia" && ubicacionesListas);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => habilitado && setPaso(p.id)}
                disabled={!habilitado}
                aria-current={paso === p.id ? "step" : undefined}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  paso === p.id
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                  !habilitado && "opacity-40",
                )}
              >
                {i + 1}. {p.titulo}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-lg text-gray-800">{consigna}</p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <TableroSvg
            tablero={escenario.tablero}
            estado={estadoTablero}
            destino={meta}
            pieza={<PiezaPersonaje id={personaje} />}
            piezaDestino={<PiezaObjetoMeta id={objetoMeta} />}
            animado={ejecutando}
            celdaResaltada={paso === "ubicaciones" ? null : undefined}
            onCeldaClick={paso === "ubicaciones" ? alTocarCelda : undefined}
            descripcionAccesible={describirTablero(escenario.tablero, estadoTablero, meta)}
            className="mx-auto block h-auto w-full max-w-[520px]"
          />
          {/* El objeto-meta se dibuja sobre la celda de meta. */}
          {meta && (
            <p className="mt-3 text-center text-sm text-gray-600">
              La meta es {OBJETOS_META.find((o) => o.id === objetoMeta)?.nombre.toLowerCase()} en la
              fila {meta.fila + 1}, columna {meta.columna + 1}.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-4">
          {paso === "escenario" && (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-2">
                {ESCENARIOS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setEscenarioId(e.id);
                      setSalida(null);
                      setMeta(null);
                      setColocando("salida");
                      reiniciarComprobacion();
                    }}
                    aria-pressed={e.id === escenarioId}
                    className={cn(
                      "rounded-lg border-2 px-3 py-3 text-left text-sm font-semibold",
                      e.id === escenarioId
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-gray-300 text-gray-800 hover:bg-gray-50",
                    )}
                  >
                    {e.nombre}
                    <span className="block text-xs font-normal text-gray-600">
                      {e.tablero.obstaculos.length} obstáculos
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPaso("piezas")}
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continuar
              </button>
            </section>
          )}

          {paso === "piezas" && (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                ¿Quién se mueve?
              </h2>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {PERSONAJES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonaje(p.id)}
                    aria-pressed={p.id === personaje}
                    className={cn(
                      "rounded-lg border-2 p-1",
                      p.id === personaje ? "border-blue-600 bg-blue-50" : "border-gray-300",
                    )}
                    title={p.nombre}
                  >
                    <MiniaturaPieza className="aspect-square w-full">
                      <PiezaPersonaje id={p.id} />
                    </MiniaturaPieza>
                    <span className="block text-center text-[10px] text-gray-700">{p.nombre}</span>
                  </button>
                ))}
              </div>

              <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                ¿A dónde tiene que llegar?
              </h2>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {OBJETOS_META.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setObjetoMeta(o.id)}
                    aria-pressed={o.id === objetoMeta}
                    className={cn(
                      "rounded-lg border-2 p-1",
                      o.id === objetoMeta ? "border-blue-600 bg-blue-50" : "border-gray-300",
                    )}
                    title={o.nombre}
                  >
                    <MiniaturaPieza className="aspect-square w-full">
                      <PiezaObjetoMeta id={o.id} />
                    </MiniaturaPieza>
                    <span className="block text-center text-[10px] text-gray-700">{o.nombre}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPaso("ubicaciones")}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continuar
              </button>
            </section>
          )}

          {paso === "ubicaciones" && (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-base font-medium text-gray-900">
                {colocando === "salida"
                  ? "Tocá un casillero para ubicar la salida."
                  : "Tocá un casillero para ubicar la meta."}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setColocando("salida")}
                  aria-pressed={colocando === "salida"}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium",
                    colocando === "salida" ? "border-blue-600 bg-blue-50" : "border-gray-300",
                  )}
                >
                  Ubicar salida
                  <span className="block text-xs font-normal text-gray-600">
                    {salida ? `fila ${salida.fila + 1}, columna ${salida.columna + 1}` : "sin ubicar"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setColocando("meta")}
                  aria-pressed={colocando === "meta"}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium",
                    colocando === "meta" ? "border-blue-600 bg-blue-50" : "border-gray-300",
                  )}
                >
                  Ubicar meta
                  <span className="block text-xs font-normal text-gray-600">
                    {meta ? `fila ${meta.fila + 1}, columna ${meta.columna + 1}` : "sin ubicar"}
                  </span>
                </button>
              </div>

              <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                ¿Hacia dónde mira al empezar?
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ORIENTACIONES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setOrientacion(o);
                      reiniciarComprobacion();
                    }}
                    aria-pressed={o === orientacion}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-sm font-medium first-letter:uppercase",
                      o === orientacion ? "border-blue-600 bg-blue-50" : "border-gray-300",
                    )}
                  >
                    {NOMBRE_ORIENTACION[o]}
                  </button>
                ))}
              </div>

              {problemas.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3">
                  {problemas.map((p) => (
                    <li key={p.mensaje} className="text-sm text-amber-900">
                      {p.mensaje}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setPaso("secuencia")}
                disabled={!ubicacionesListas}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                Continuar
              </button>
            </section>
          )}

          {paso === "secuencia" && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  El código de nuestra clase
                </h2>
                <div className="mt-2">
                  <BancoDeSimbolos
                    simbolos={simbolos}
                    restantes={MAX_ACCIONES - secuencia.length}
                    deshabilitado={ejecutando}
                    onAgregar={(accion) => {
                      reiniciarComprobacion();
                      setSecuencia((previa) =>
                        previa.length >= MAX_ACCIONES ? previa : [...previa, accion],
                      );
                    }}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <ListaSecuencia
                  simbolos={simbolos}
                  secuencia={secuencia}
                  indiceEnCurso={indiceEnCurso}
                  deshabilitado={ejecutando}
                  onCambiar={(nueva) => {
                    reiniciarComprobacion();
                    setSecuencia(nueva);
                  }}
                />

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={probar}
                    disabled={ejecutando || secuencia.length === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    <Play aria-hidden className="h-5 w-5" />
                    Probar
                  </button>
                  <button
                    type="button"
                    onClick={reiniciarComprobacion}
                    disabled={ejecutando}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <RotateCcw aria-hidden className="h-4 w-4" />
                    Reiniciar
                  </button>
                </div>

                {resultado && (
                  <div
                    aria-live="polite"
                    className={cn(
                      "mt-3 rounded-lg border-2 p-3",
                      resultado.tono === "logro" ? "border-green-600 bg-green-50" : "border-amber-500 bg-amber-50",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {resultado.etiqueta}
                    </p>
                    <p className="text-base font-bold text-gray-900">{resultado.titulo}</p>
                    <p className="text-sm text-gray-700">{resultado.detalle}</p>
                  </div>
                )}

                {errorGuardado && (
                  <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    {errorGuardado}
                  </p>
                )}

                <button
                  type="button"
                  onClick={guardar}
                  disabled={!resuelta || guardando || ejecutando}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {guardando ? "Guardando…" : "La misión funciona: sumarla a la sala"}
                </button>
                {!resuelta && (
                  <p className="mt-2 text-sm text-gray-600">
                    Para sumarla a la sala hace falta una secuencia que llegue a la meta.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
