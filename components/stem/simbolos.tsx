"use client";

import { useCallback, useEffect, useRef } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { dibujoAPath, type Dibujo, type Punto } from "@/lib/stem/misiones/trazos";
import { cn } from "@/lib/stem/cn";

/**
 * Lienzo de dibujo de un símbolo del código de la clase.
 *
 * Sección 3.1 del manual: trazo oscuro sobre fondo claro, sin paletas, stickers,
 * texto ni efectos. Los únicos controles son Deshacer y Borrar. El nombre de la
 * acción se muestra siempre fuera del área de dibujo, para que quede claro qué
 * asociación se está estableciendo.
 *
 * El sistema no interpreta el trazo: el significado viene del casillero donde se
 * dibujó.
 */

/** Lado del lienzo en unidades del viewBox. */
const LADO = 200;

/** Grosor amplio y estable, pensado para el uso táctil de chicos de 6 a 8 años. */
const GROSOR = 9;

/** Distancia mínima entre puntos guardados. Evita acumular puntos repetidos. */
const PASO_MINIMO = 0.012;

export function SimboloSvg({
  dibujo,
  className,
  titulo,
}: {
  dibujo: Dibujo;
  className?: string;
  titulo?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${LADO} ${LADO}`}
      className={className}
      role="img"
      aria-label={titulo ?? "Símbolo dibujado por la clase"}
    >
      <path
        d={dibujoAPath(dibujo, LADO)}
        fill="none"
        stroke="#1e293b"
        strokeWidth={GROSOR}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LienzoSimbolo({
  etiqueta,
  ayuda,
  dibujo,
  onCambiar,
}: {
  /** Nombre de la acción. Se muestra fuera del área de dibujo. */
  etiqueta: string;
  ayuda?: string;
  dibujo: Dibujo;
  onCambiar: (dibujo: Dibujo) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  /**
   * El trazo en curso se lleva en refs, no en estado.
   *
   * Los eventos de puntero llegan mucho más rápido de lo que React vuelve a
   * renderizar: si el manejador de movimiento leyera estado, descartaría todos
   * los puntos que lleguen antes del siguiente render y el trazo saldría
   * cortado. Con refs, cada punto se toma tal como llega.
   */
  const dibujandoRef = useRef(false);
  const dibujoRef = useRef<Dibujo>(dibujo);

  // Mantiene la copia al día cuando el dibujo cambia desde afuera.
  useEffect(() => {
    dibujoRef.current = dibujo;
  }, [dibujo]);

  const emitir = useCallback(
    (nuevo: Dibujo) => {
      dibujoRef.current = nuevo;
      onCambiar(nuevo);
    },
    [onCambiar],
  );

  /** Convierte la posición del puntero a coordenadas relativas del lienzo. */
  const puntoDesdeEvento = useCallback((e: React.PointerEvent<SVGSVGElement>): Punto | null => {
    const caja = svgRef.current?.getBoundingClientRect();
    if (!caja || caja.width === 0 || caja.height === 0) return null;
    const x = (e.clientX - caja.left) / caja.width;
    const y = (e.clientY - caja.top) / caja.height;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  }, []);

  const alApoyar = (e: React.PointerEvent<SVGSVGElement>) => {
    const punto = puntoDesdeEvento(e);
    if (!punto) return;
    // Capturamos el puntero para que el trazo siga aunque el dedo salga del
    // lienzo. Si el navegador no lo permite, se dibuja igual: solo se pierde el
    // trazo cuando el dedo se va del área.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Sin captura de puntero el dibujo sigue funcionando.
    }
    dibujandoRef.current = true;
    emitir([...dibujoRef.current, [punto]]);
  };

  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dibujandoRef.current) return;
    const punto = puntoDesdeEvento(e);
    if (!punto) return;

    const actual = dibujoRef.current;
    const trazoActual = actual[actual.length - 1];
    if (!trazoActual) return;

    // Puntos demasiado juntos no agregan forma y solo engordan el dibujo.
    const ultimo = trazoActual[trazoActual.length - 1];
    if (ultimo) {
      const distancia = Math.hypot(punto[0] - ultimo[0], punto[1] - ultimo[1]);
      if (distancia < PASO_MINIMO) return;
    }

    emitir([...actual.slice(0, -1), [...trazoActual, punto]]);
  };

  const alLevantar = () => {
    dibujandoRef.current = false;
  };

  const deshacer = () => emitir(dibujoRef.current.slice(0, -1));
  const borrar = () => emitir([]);

  const vacio = dibujo.length === 0;
  const idLienzo = `lienzo-${etiqueta.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="rounded-xl border-2 border-gray-300 bg-white p-3">
      {/* El nombre de la acción vive fuera del área de dibujo. */}
      <p className="text-center text-sm font-bold uppercase tracking-wide text-gray-900">
        {etiqueta}
      </p>
      {ayuda && <p className="mt-0.5 text-center text-xs text-gray-600">{ayuda}</p>}

      <svg
        ref={svgRef}
        id={idLienzo}
        viewBox={`0 0 ${LADO} ${LADO}`}
        className={cn(
          "sin-gestos mt-2 aspect-square w-full rounded-lg border-2 bg-white",
          vacio ? "border-dashed border-gray-400" : "border-gray-300",
        )}
        onPointerDown={alApoyar}
        onPointerMove={alMover}
        onPointerUp={alLevantar}
        onPointerCancel={alLevantar}
        role="img"
        aria-label={`Espacio para dibujar el símbolo de ${etiqueta}. ${
          vacio ? "Todavía está en blanco." : `Tiene ${dibujo.length} trazos.`
        }`}
      >
        <path
          d={dibujoAPath(dibujo, LADO)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={GROSOR}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={deshacer}
          disabled={vacio}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
        >
          <Undo2 aria-hidden className="h-4 w-4" />
          Deshacer
        </button>
        <button
          type="button"
          onClick={borrar}
          disabled={vacio}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
        >
          <Eraser aria-hidden className="h-4 w-4" />
          Borrar
        </button>
      </div>

      {vacio && (
        <p className="mt-2 text-center text-xs font-medium text-amber-700">
          Falta dibujar este símbolo.
        </p>
      )}
    </div>
  );
}
