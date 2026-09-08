import type { Celda, Estado, Tablero } from "@/lib/stem/grid/tipos";

/**
 * Las tres misiones del Robot mensajero (sección 10 del manual).
 *
 * En todas se mantiene el mismo dispositivo y la misma lógica de interacción:
 * lo único que cambia es el recorrido. El robot lleva el sobre desde el
 * comienzo, porque el repertorio de acciones no incluye tomar ni dejar.
 */

export interface MisionRobot {
  id: number;
  titulo: string;
  /** Qué se busca poner en juego. Es información docente, no se muestra al alumno. */
  propositoDidactico: string;
  tablero: Tablero;
  inicio: Estado;
  destino: Celda;
  /** Nombre del lugar de entrega, para el escenario esquemático de la escuela. */
  nombreDestino: string;
  /**
   * En la misión diagnóstica no se muestra el repertorio de acciones: los
   * estudiantes tienen que formular indicaciones espontáneas.
   */
  mostrarRepertorioPorDefecto: boolean;
}

export const MISIONES: readonly MisionRobot[] = [
  {
    id: 1,
    titulo: "Primer envío",
    propositoDidactico:
      "Diagnóstico: relevar cómo formulan indicaciones y qué atribuciones hacen al funcionamiento del sistema.",
    // Recorrido corto: una recta y un giro.
    tablero: { filas: 5, columnas: 5, obstaculos: [] },
    inicio: { celda: { fila: 4, columna: 0 }, orientacion: "ESTE" },
    destino: { fila: 2, columna: 2 },
    nombreDestino: "Sala de maestros",
    mostrarRepertorioPorDefecto: false,
  },
  {
    id: 2,
    titulo: "Camino con obstáculo",
    propositoDidactico:
      "Poner en juego precisión espacial, secuencia y revisión de instrucciones.",
    // Varios giros y control de cantidades. Los tres obstáculos están puestos
    // para que no exista la "L" de dos giros: uno corta la subida por la
    // primera columna, otro corta la subida por la última, y el tercero deja al
    // destino accesible solo desde abajo. El recorrido más corto necesita
    // cuatro giros.
    tablero: {
      filas: 5,
      columnas: 5,
      obstaculos: [
        { fila: 2, columna: 0 },
        { fila: 3, columna: 4 },
        { fila: 0, columna: 3 },
      ],
    },
    inicio: { celda: { fila: 4, columna: 0 }, orientacion: "NORTE" },
    destino: { fila: 0, columna: 4 },
    nombreDestino: "Biblioteca",
    mostrarRepertorioPorDefecto: false,
  },
  {
    id: 3,
    titulo: "Dos rutas posibles",
    propositoDidactico:
      "Comparar soluciones diferentes para un mismo problema y anticipar secuencias.",
    // El obstáculo está justo en el medio del camino recto: se puede rodear por
    // arriba o por abajo, y las dos rutas cuestan lo mismo.
    tablero: {
      filas: 5,
      columnas: 5,
      obstaculos: [{ fila: 2, columna: 2 }],
    },
    inicio: { celda: { fila: 2, columna: 0 }, orientacion: "ESTE" },
    destino: { fila: 2, columna: 4 },
    nombreDestino: "Dirección",
    mostrarRepertorioPorDefecto: false,
  },
] as const;

export function misionPorId(id: number): MisionRobot {
  return MISIONES.find((m) => m.id === id) ?? MISIONES[0];
}
