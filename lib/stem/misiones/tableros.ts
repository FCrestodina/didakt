import type { Tablero } from "@/lib/stem/grid/tipos";

/**
 * Los cuatro escenarios del Creador de misiones (sección 4.2 del manual).
 *
 * Todos tienen la misma cantidad de filas y columnas (6 × 6, la medida de
 * referencia) y cambian solo en la disposición de los obstáculos. Se mantienen
 * pocos obstáculos y bien separados para que el recorrido siga siendo legible a
 * simple vista en una tableta.
 */

export interface EscenarioMision {
  id: number;
  nombre: string;
  tablero: Tablero;
}

export const LADO_TABLERO = 6;

export const ESCENARIOS: readonly EscenarioMision[] = [
  {
    id: 1,
    nombre: "El patio",
    // Dos obstáculos sueltos: el escenario más abierto, deja muchas rutas.
    tablero: {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 2, columna: 2 },
        { fila: 3, columna: 4 },
      ],
    },
  },
  {
    id: 2,
    nombre: "Los pasillos",
    // Dos tramos de pared que arman corredores y obligan a rodear.
    tablero: {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 1, columna: 1 },
        { fila: 2, columna: 1 },
        { fila: 3, columna: 1 },
        { fila: 2, columna: 4 },
        { fila: 3, columna: 4 },
        { fila: 4, columna: 4 },
      ],
    },
  },
  {
    id: 3,
    nombre: "La plaza",
    // Un bloque central que se puede rodear por los dos lados con el mismo costo.
    tablero: {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 2, columna: 2 },
        { fila: 2, columna: 3 },
        { fila: 3, columna: 2 },
        { fila: 3, columna: 3 },
      ],
    },
  },
  {
    id: 4,
    nombre: "El laberinto",
    // El más cerrado de los cuatro: recorridos largos con varios cambios de
    // dirección, pero sin celdas aisladas.
    tablero: {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 1, columna: 2 },
        { fila: 1, columna: 3 },
        { fila: 2, columna: 0 },
        { fila: 3, columna: 5 },
        { fila: 4, columna: 1 },
        { fila: 4, columna: 2 },
        { fila: 4, columna: 3 },
      ],
    },
  },
] as const;

export function escenarioPorId(id: number): EscenarioMision {
  return ESCENARIOS.find((e) => e.id === id) ?? ESCENARIOS[0];
}
