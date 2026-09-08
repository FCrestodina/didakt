"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SimboloSvg } from "@/components/stem/simbolos";
import { ACCIONES, ETIQUETA_ACCION, type Accion } from "@/lib/stem/grid/tipos";
import { agruparRepeticiones } from "@/lib/stem/misiones/agrupacion";
import type { CodigoClase } from "@/lib/stem/misiones/trazos";
import { cn } from "@/lib/stem/cn";

/**
 * Construcción de la secuencia con los símbolos del código de la clase.
 *
 * Sección 4.4 del manual: un toque agrega el símbolo al final, se puede
 * reordenar arrastrando y también con botones de mover a izquierda y derecha,
 * se puede eliminar un símbolo y limpiar toda la secuencia.
 *
 * Sección 4.5: cuando una acción aparece dos o más veces seguidas, se ofrece
 * agruparla y mostrarla como símbolo × 2, × 3 o × 4. La agrupación es solo una
 * forma de mostrar la misma secuencia: no cambia lo que se ejecuta, así que
 * siempre es reversible y siempre corre la misma cantidad de acciones.
 */

export function BancoDeSimbolos({
  simbolos,
  onAgregar,
  deshabilitado,
  restantes,
}: {
  simbolos: CodigoClase;
  onAgregar: (accion: Accion) => void;
  deshabilitado?: boolean;
  restantes: number;
}) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {ACCIONES.map((accion) => (
          <button
            key={accion}
            type="button"
            onClick={() => onAgregar(accion)}
            disabled={deshabilitado || restantes <= 0}
            className="rounded-xl border-2 border-gray-300 bg-white p-2 hover:border-blue-600 disabled:opacity-40"
            aria-label={`Agregar ${ETIQUETA_ACCION[accion]} a la secuencia`}
          >
            <SimboloSvg
              dibujo={simbolos[accion] ?? []}
              titulo={ETIQUETA_ACCION[accion]}
              className="aspect-square w-full"
            />
            {/* El nombre acompaña siempre al símbolo: no se depende solo del dibujo. */}
            <span className="mt-1 block text-center text-[11px] font-semibold uppercase leading-tight text-gray-700">
              {ETIQUETA_ACCION[accion]}
            </span>
          </button>
        ))}
      </div>
      {restantes <= 0 && (
        <p className="mt-2 text-sm text-amber-800">
          La secuencia llegó al máximo de acciones. Quitá alguna para seguir agregando.
        </p>
      )}
    </div>
  );
}

export function ListaSecuencia({
  simbolos,
  secuencia,
  onCambiar,
  deshabilitado,
  indiceEnCurso,
}: {
  simbolos: CodigoClase;
  secuencia: Accion[];
  onCambiar: (secuencia: Accion[]) => void;
  deshabilitado?: boolean;
  /** Índice que se está ejecutando, para seguir la animación. */
  indiceEnCurso?: number | null;
}) {
  const [agrupar, setAgrupar] = useState(false);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const arrastrandoRef = useRef<number | null>(null);

  const mover = (desde: number, hasta: number) => {
    if (hasta < 0 || hasta >= secuencia.length || desde === hasta) return;
    const copia = [...secuencia];
    const [pieza] = copia.splice(desde, 1);
    copia.splice(hasta, 0, pieza);
    onCambiar(copia);
    setSeleccionado(hasta);
  };

  const quitar = (indice: number) => {
    onCambiar(secuencia.filter((_, i) => i !== indice));
    setSeleccionado(null);
  };

  const tramos = agruparRepeticiones(secuencia);
  const hayRepeticiones = tramos.some((t) => t.repeticiones > 1);

  /** Índice de la ficha que está debajo del puntero, si la hay. */
  const indiceBajoElPuntero = (x: number, y: number): number | null => {
    const elemento = document.elementFromPoint(x, y)?.closest("[data-indice]");
    const valor = elemento?.getAttribute("data-indice");
    return valor === null || valor === undefined ? null : Number(valor);
  };

  if (secuencia.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
        Usá los símbolos del código para indicar el recorrido.
      </div>
    );
  }

  return (
    <div>
      <ol className="flex flex-wrap gap-2 rounded-xl border-2 border-gray-300 bg-white p-3">
        {(agrupar ? tramos : secuencia.map((accion, i) => ({ accion, repeticiones: 1, indices: [i] }))).map(
          (tramo) => {
            const indice = tramo.indices[0];
            const enCurso =
              indiceEnCurso !== null &&
              indiceEnCurso !== undefined &&
              tramo.indices.includes(indiceEnCurso);

            return (
              <li
                key={indice}
                data-indice={indice}
                className={cn(
                  "sin-gestos relative w-20 rounded-lg border-2 bg-white p-1",
                  enCurso
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : seleccionado === indice
                      ? "border-gray-900"
                      : "border-gray-300",
                )}
                onPointerDown={(e) => {
                  if (deshabilitado || agrupar) return;
                  arrastrandoRef.current = indice;
                  setSeleccionado(indice);
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    // Sin captura de puntero quedan los botones de mover.
                  }
                }}
                onPointerMove={(e) => {
                  if (arrastrandoRef.current === null) return;
                  const destino = indiceBajoElPuntero(e.clientX, e.clientY);
                  if (destino !== null && destino !== arrastrandoRef.current) {
                    mover(arrastrandoRef.current, destino);
                    arrastrandoRef.current = destino;
                  }
                }}
                onPointerUp={() => {
                  arrastrandoRef.current = null;
                }}
                onPointerCancel={() => {
                  arrastrandoRef.current = null;
                }}
              >
                <SimboloSvg
                  dibujo={simbolos[tramo.accion] ?? []}
                  titulo={`${ETIQUETA_ACCION[tramo.accion]}${
                    tramo.repeticiones > 1 ? `, ${tramo.repeticiones} veces` : ""
                  }`}
                  className="aspect-square w-full"
                />
                <span className="block text-center text-[10px] font-semibold uppercase leading-tight text-gray-600">
                  {tramo.repeticiones > 1 ? `× ${tramo.repeticiones}` : `${indice + 1}`}
                </span>

                {!deshabilitado && !agrupar && (
                  <button
                    type="button"
                    onClick={() => quitar(indice)}
                    className="absolute -right-2 -top-2 rounded-full border border-gray-300 bg-white p-0.5 text-gray-600 hover:bg-gray-100"
                    aria-label={`Quitar ${ETIQUETA_ACCION[tramo.accion]} de la posición ${indice + 1}`}
                  >
                    <X aria-hidden className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          },
        )}
      </ol>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Alternativa por botones al arrastre. */}
        <button
          type="button"
          onClick={() => seleccionado !== null && mover(seleccionado, seleccionado - 1)}
          disabled={deshabilitado || agrupar || seleccionado === null || seleccionado === 0}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
          Mover a la izquierda
        </button>
        <button
          type="button"
          onClick={() => seleccionado !== null && mover(seleccionado, seleccionado + 1)}
          disabled={
            deshabilitado ||
            agrupar ||
            seleccionado === null ||
            seleccionado === secuencia.length - 1
          }
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
        >
          Mover a la derecha
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onCambiar([])}
          disabled={deshabilitado}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Borrar secuencia
        </button>

        {hayRepeticiones && (
          <button
            type="button"
            onClick={() => {
              setAgrupar((v) => !v);
              setSeleccionado(null);
            }}
            aria-pressed={agrupar}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {agrupar ? "Ver la secuencia completa" : "Agrupar repetición"}
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {secuencia.length} {secuencia.length === 1 ? "acción" : "acciones"}
        {agrupar && " · agrupadas para verlas más cortas, se ejecutan todas igual"}
        {seleccionado !== null && !agrupar && ` · seleccionaste la posición ${seleccionado + 1}`}
      </p>
    </div>
  );
}
