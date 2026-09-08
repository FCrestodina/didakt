"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { BancoDeSimbolos, ListaSecuencia } from "@/components/stem/ConstructorSecuencia";
import { PiezaObjetoMeta, PiezaPersonaje } from "@/components/stem/piezasMision";
import { SimboloSvg } from "@/components/stem/simbolos";
import { TableroSvg, describirTablero } from "@/components/stem/TableroSvg";
import { ejecutarSecuencia } from "@/lib/stem/grid/motor";
import {
  ACCIONES,
  ETIQUETA_ACCION,
  NOMBRE_ORIENTACION,
  type Accion,
  type Celda,
  type Orientacion,
} from "@/lib/stem/grid/tipos";
import { nombreObjetoMeta, nombrePersonaje } from "@/lib/stem/misiones/catalogo";
import { mensajeDeEjecucion, type MensajeResultado } from "@/lib/stem/misiones/mensajes";
import { escenarioPorId } from "@/lib/stem/misiones/tableros";
import type { CodigoClase } from "@/lib/stem/misiones/trazos";
import { MAX_ACCIONES } from "@/lib/stem/misiones/validacion";
import { cn } from "@/lib/stem/cn";

/**
 * Módulo C · Sala de misiones, en modo solo juego.
 *
 * Es lo que abre el grupo visitante durante la socialización. No pide ningún
 * dato, no muestra herramientas de edición y no revela la solución del grupo
 * autor antes del intento.
 *
 * La aplicación acepta cualquier secuencia que llegue a la meta: no compara
 * contra una respuesta correcta única.
 */

interface MisionPublica {
  id: string;
  numero: number;
  escenarioId: number;
  personaje: string;
  objetoMeta: string;
  salida: Celda;
  orientacion: Orientacion;
  meta: Celda;
}

const MS_POR_PASO = 380;

export default function PaginaSalaDeJuego({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);

  const [simbolos, setSimbolos] = useState<CodigoClase | null>(null);
  const [misiones, setMisiones] = useState<MisionPublica[]>([]);
  const [carga, setCarga] = useState<"cargando" | "lista" | "noExiste" | "error">("cargando");
  const [elegida, setElegida] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const respuesta = await fetch(`/api/salas/juego/${codigo}`);
        if (cancelado) return;
        if (respuesta.status === 404) {
          setCarga("noExiste");
          return;
        }
        if (!respuesta.ok) {
          setCarga("error");
          return;
        }
        const sala = await respuesta.json();
        setSimbolos(sala.simbolos);
        setMisiones(sala.misiones);
        setCarga("lista");
      } catch {
        if (!cancelado) setCarga("error");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [codigo]);

  if (carga === "cargando") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-gray-600">Abriendo la sala de misiones…</p>
      </main>
    );
  }

  if (carga !== "lista" || !simbolos) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">
          {carga === "noExiste" ? "No encontramos esa sala" : "No se pudo abrir la sala"}
        </h1>
        <p className="mt-2 text-gray-600">
          {carga === "noExiste"
            ? "El código de juego puede estar mal escrito, o la sala ya caducó."
            : "Revisá la conexión y volvé a intentar."}
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

  const mision = misiones.find((m) => m.numero === elegida) ?? null;

  if (!mision) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Sala de misiones</h1>
        <p className="mt-2 text-gray-600">
          Estas son las misiones que armó la otra clase. Elegí una para empezar.
        </p>

        <LeyendaDelCodigo simbolos={simbolos} />

        {misiones.length === 0 ? (
          <p className="mt-6 rounded-xl bg-gray-50 p-5 text-gray-700">
            Esta sala todavía no tiene misiones publicadas.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {misiones.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setElegida(m.numero)}
                  className="w-full rounded-xl border-2 border-gray-300 bg-white p-4 text-left hover:border-blue-600"
                >
                  <p className="text-lg font-bold text-gray-900">Misión {m.numero}</p>
                  <p className="text-sm text-gray-600">
                    {escenarioPorId(m.escenarioId).nombre} · {nombrePersonaje(m.personaje)} hasta{" "}
                    {nombreObjetoMeta(m.objetoMeta).toLowerCase()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  return (
    <Juego
      key={mision.id}
      mision={mision}
      simbolos={simbolos}
      hayOtra={misiones.some((m) => m.numero === mision.numero + 1)}
      onVolver={() => setElegida(null)}
      onSiguiente={() => setElegida(mision.numero + 1)}
    />
  );
}

function LeyendaDelCodigo({ simbolos }: { simbolos: CodigoClase }) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        El código de la clase que armó estas misiones
      </h2>
      <ul className="mt-2 grid grid-cols-4 gap-2">
        {ACCIONES.map((accion) => (
          <li key={accion} className="rounded-lg border border-gray-200 p-1">
            <SimboloSvg
              dibujo={simbolos[accion] ?? []}
              titulo={ETIQUETA_ACCION[accion]}
              className="aspect-square w-full"
            />
            {/* Cada símbolo va siempre acompañado del nombre de la acción. */}
            <span className="mt-1 block text-center text-[10px] font-semibold uppercase leading-tight text-gray-700">
              {ETIQUETA_ACCION[accion]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Juego({
  mision,
  simbolos,
  hayOtra,
  onVolver,
  onSiguiente,
}: {
  mision: MisionPublica;
  simbolos: CodigoClase;
  hayOtra: boolean;
  onVolver: () => void;
  onSiguiente: () => void;
}) {
  const escenario = escenarioPorId(mision.escenarioId);
  const inicio = { celda: mision.salida, orientacion: mision.orientacion };

  const [secuencia, setSecuencia] = useState<Accion[]>([]);
  const [posicion, setPosicion] = useState(inicio);
  const [indiceEnCurso, setIndiceEnCurso] = useState<number | null>(null);
  const [resultado, setResultado] = useState<MensajeResultado | null>(null);
  const [resuelta, setResuelta] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);

  const temporizadoresRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const limpiar = useCallback(() => {
    temporizadoresRef.current.forEach(clearTimeout);
    temporizadoresRef.current = [];
  }, []);
  useEffect(() => limpiar, [limpiar]);

  const reiniciar = useCallback(() => {
    limpiar();
    setEjecutando(false);
    setPosicion(inicio);
    setIndiceEnCurso(null);
    setResultado(null);
    setResuelta(false);
    // inicio se deriva de la misión, que no cambia mientras el componente vive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limpiar, mision.id]);

  const probar = () => {
    if (secuencia.length === 0) return;
    limpiar();
    setResultado(null);
    setResuelta(false);
    setPosicion(inicio);

    const ejecucion = ejecutarSecuencia(escenario.tablero, inicio, mision.meta, secuencia);
    setEjecutando(true);

    ejecucion.pasos.forEach((paso, i) => {
      const id = setTimeout(() => {
        setIndiceEnCurso(paso.indice);
        setPosicion(paso.estadoPosterior);
        if (i === ejecucion.pasos.length - 1) {
          setResultado(mensajeDeEjecucion(ejecucion));
          setResuelta(ejecucion.exito);
          setEjecutando(false);
          setIndiceEnCurso(null);
        }
      }, MS_POR_PASO * (i + 1));
      temporizadoresRef.current.push(id);
    });

    if (ejecucion.pasos.length === 0) {
      setResultado(mensajeDeEjecucion(ejecucion));
      setResuelta(ejecucion.exito);
      setEjecutando(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <button
        type="button"
        onClick={onVolver}
        className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Volver a la sala de misiones
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Misión {mision.numero}</h1>
      <p className="mt-1 text-gray-600">
        Armá una secuencia para llegar a la meta. El {nombrePersonaje(mision.personaje).toLowerCase()}{" "}
        arranca mirando {NOMBRE_ORIENTACION[mision.orientacion]} y tiene que llegar a{" "}
        {nombreObjetoMeta(mision.objetoMeta).toLowerCase()}.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <TableroSvg
            tablero={escenario.tablero}
            estado={posicion}
            destino={mision.meta}
            pieza={<PiezaPersonaje id={mision.personaje} />}
            piezaDestino={<PiezaObjetoMeta id={mision.objetoMeta} />}
            animado={ejecutando}
            descripcionAccesible={describirTablero(escenario.tablero, posicion, mision.meta)}
            className="mx-auto block h-auto w-full max-w-[520px]"
          />
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              El código de la clase
            </h2>
            <div className="mt-2">
              <BancoDeSimbolos
                simbolos={simbolos}
                restantes={MAX_ACCIONES - secuencia.length}
                deshabilitado={ejecutando}
                onAgregar={(accion) => {
                  setResultado(null);
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
                setResultado(null);
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
                onClick={reiniciar}
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
                  resultado.tono === "logro"
                    ? "border-green-600 bg-green-50"
                    : "border-amber-500 bg-amber-50",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {resultado.etiqueta}
                </p>
                <p className="text-base font-bold text-gray-900">{resultado.titulo}</p>
                <p className="text-sm text-gray-700">{resultado.detalle}</p>
              </div>
            )}

            {/* Al resolver se ofrece buscar otra forma, no solo pasar a la siguiente. */}
            {resuelta && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    reiniciar();
                    setSecuencia([]);
                  }}
                  className="flex-1 rounded-lg border-2 border-blue-600 px-4 py-3 font-semibold text-blue-800 hover:bg-blue-50"
                >
                  Probar otra forma
                </button>
                {hayOtra ? (
                  <button
                    type="button"
                    onClick={onSiguiente}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Siguiente misión
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onVolver}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Volver a la sala
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
