/**
 * Tipos del motor de grilla, compartidos por las dos herramientas de la secuencia:
 * el Robot mensajero (Desafío 1) y el Creador de misiones (Desafíos 2 a 4).
 *
 * Las dos usan exactamente las mismas reglas de movimiento, por eso el motor vive
 * en un solo lugar y se testea una sola vez.
 */

/**
 * Orientación cardinal del dispositivo sobre el tablero.
 *
 * La fila crece hacia abajo (coordenadas de pantalla), así que NORTE resta filas.
 * Esto importa: la derecha y la izquierda se calculan siempre desde la orientación
 * del dispositivo, nunca desde la derecha de la pantalla.
 */
export type Orientacion = "NORTE" | "ESTE" | "SUR" | "OESTE";

export const ORIENTACIONES: readonly Orientacion[] = [
  "NORTE",
  "ESTE",
  "SUR",
  "OESTE",
] as const;

/** Nombre legible de cada orientación, para la interfaz y los mensajes de estado. */
export const NOMBRE_ORIENTACION: Record<Orientacion, string> = {
  NORTE: "hacia arriba",
  ESTE: "hacia la derecha",
  SUR: "hacia abajo",
  OESTE: "hacia la izquierda",
};

/** Grados de rotación de cada orientación, para dibujar la flecha en el SVG. */
export const GRADOS_ORIENTACION: Record<Orientacion, number> = {
  NORTE: 0,
  ESTE: 90,
  SUR: 180,
  OESTE: 270,
};

export interface Celda {
  fila: number;
  columna: number;
}

/**
 * Las cuatro acciones canónicas del repertorio. Son las mismas en las dos
 * herramientas: en el Robot llegan por voz o texto, en el Creador de misiones
 * llegan como los símbolos que dibujó la clase.
 *
 * No existe interpretación contextual: cada acción ejecuta siempre lo mismo.
 */
export type Accion =
  | "AVANZAR"
  | "GIRO_DERECHA_90"
  | "GIRO_IZQUIERDA_90"
  | "DETENER";

export const ACCIONES: readonly Accion[] = [
  "AVANZAR",
  "GIRO_DERECHA_90",
  "GIRO_IZQUIERDA_90",
  "DETENER",
] as const;

/**
 * Etiqueta de cada acción tal como se muestra en la interfaz.
 *
 * En el Creador de misiones son los nombres de los cuatro casilleros de dibujo:
 * el símbolo queda asociado a la acción por el lugar donde fue dibujado, no
 * porque el sistema interprete el trazo.
 */
export const ETIQUETA_ACCION: Record<Accion, string> = {
  AVANZAR: "AVANZAR",
  GIRO_DERECHA_90: "GIRAR A LA DERECHA",
  GIRO_IZQUIERDA_90: "GIRAR A LA IZQUIERDA",
  DETENER: "DETENERSE",
};

export interface Tablero {
  filas: number;
  columnas: number;
  /** Celdas que no se pueden ocupar ni atravesar. */
  obstaculos: readonly Celda[];
}

/** Posición y orientación del dispositivo en un momento dado. */
export interface Estado {
  celda: Celda;
  orientacion: Orientacion;
}

/**
 * Por qué terminó una ejecución.
 *
 * Los cuatro motivos de corte se corresponden con los tipos de falla que el
 * manual del Robot mensajero (sección 8) pide distinguir, y con la tabla de
 * comportamiento esperado del Creador de misiones (sección 4.6).
 */
export type MotivoFin =
  /** El dispositivo entró en la celda-meta. Único criterio de éxito. */
  | "META_ALCANZADA"
  /** El siguiente movimiento encuentra un obstáculo. No se ocupa la celda. */
  | "OBSTACULO"
  /** El siguiente movimiento sale del recorrido. No se ocupa la celda. */
  | "FUERA_DEL_TABLERO"
  /** Se ejecutó DETENER antes de llegar a la meta. */
  | "DETENIDO"
  /** La secuencia terminó sin llegar a la meta y sin bloqueos. */
  | "SECUENCIA_COMPLETA";

export interface PasoEjecucion {
  /** Posición de la acción dentro de la secuencia recibida. */
  indice: number;
  accion: Accion;
  estadoPrevio: Estado;
  estadoPosterior: Estado;
  /**
   * false cuando la acción era válida pero el entorno la bloqueó (obstáculo o
   * límite del tablero). El estado no cambia y la ejecución se corta.
   */
  aplicada: boolean;
}

export interface ResultadoEjecucion {
  /** Traza completa, para animar el recorrido paso a paso. */
  pasos: readonly PasoEjecucion[];
  estadoFinal: Estado;
  motivo: MotivoFin;
  /** Cuántas acciones llegaron a modificar el estado. */
  accionesAplicadas: number;
  /** Índice de la acción que quedó bloqueada, o null si no hubo bloqueo. */
  indiceBloqueo: number | null;
  /** Verdadero solo si el motivo es META_ALCANZADA. */
  exito: boolean;
}
