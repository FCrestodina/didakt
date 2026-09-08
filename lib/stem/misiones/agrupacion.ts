import type { Accion } from "@/lib/stem/grid/tipos";

/**
 * Agrupación visual de repeticiones (sección 4.5 del manual).
 *
 * Cuando una acción aparece dos o más veces seguidas, la interfaz puede
 * mostrarla como símbolo × 2, × 3 o × 4 en lugar de repetir el dibujo.
 *
 * Es solo una forma de mostrar la misma secuencia: no existe un bloque de bucle,
 * no se guarda nada distinto y no se introduce vocabulario técnico. Por eso la
 * agrupación siempre es reversible y siempre ejecuta exactamente la misma
 * cantidad de acciones que la secuencia expandida.
 */

export interface Tramo {
  accion: Accion;
  repeticiones: number;
  /** Posiciones que ocupa este tramo dentro de la secuencia expandida. */
  indices: number[];
}

/** Tope de repeticiones que se muestran juntas. */
export const MAX_REPETICIONES = 4;

export function agruparRepeticiones(
  secuencia: readonly Accion[],
  maxRepeticiones: number = MAX_REPETICIONES,
): Tramo[] {
  const tramos: Tramo[] = [];
  for (let i = 0; i < secuencia.length; i++) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.accion === secuencia[i] && ultimo.repeticiones < maxRepeticiones) {
      ultimo.repeticiones++;
      ultimo.indices.push(i);
    } else {
      tramos.push({ accion: secuencia[i], repeticiones: 1, indices: [i] });
    }
  }
  return tramos;
}

/** Vuelve de la vista agrupada a la secuencia expandida. */
export function expandirTramos(tramos: readonly Tramo[]): Accion[] {
  return tramos.flatMap((tramo) => Array.from({ length: tramo.repeticiones }, () => tramo.accion));
}
