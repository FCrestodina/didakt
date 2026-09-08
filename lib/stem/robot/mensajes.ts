import type { ResultadoEjecucion } from "@/lib/stem/grid/tipos";
import type { Interpretacion } from "./interprete";
import { MENSAJE_FALLA, type FallaVoz } from "./voz";

/**
 * Mensajes del panel "Estado de la instrucción".
 *
 * Toda la interfaz describe acciones y estados del sistema sin atribuir
 * procesos humanos. La sección 9 del manual fija el vocabulario: se usa
 * "Se reconoció", "Instrucción reconocida", "Falta información para realizar
 * una acción", "Esta acción no está prevista en este sistema", "El movimiento
 * está bloqueado por un obstáculo", "Destino alcanzado".
 *
 * Nunca: "entendí", "me confundí", "no sé hacer eso", "no quiero", "lo logré".
 */

export type TonoMensaje = "neutro" | "logro" | "atencion";

export interface MensajeEstado {
  /** Encabezado corto del panel. */
  titulo: string;
  /** Línea "Se reconoció: …", o null si no hubo transcripción. */
  transcripcion: string | null;
  /** Qué ocurrió y por qué. */
  detalle: string;
  tono: TonoMensaje;
  /** Etiqueta textual del tono, para no depender solo del color. */
  etiquetaTono: string;
}

const ETIQUETA: Record<TonoMensaje, string> = {
  neutro: "Información",
  logro: "Misión cumplida",
  atencion: "Sin movimiento",
};

function conEtiqueta(mensaje: Omit<MensajeEstado, "etiquetaTono">): MensajeEstado {
  return { ...mensaje, etiquetaTono: ETIQUETA[mensaje.tono] };
}

/** Mensaje de los estados de interfaz previos a la interpretación (sección 4.1). */
export const MENSAJE_LISTO: MensajeEstado = conEtiqueta({
  titulo: "Listo",
  transcripcion: null,
  detalle: "Presioná el micrófono para dar una instrucción.",
  tono: "neutro",
});

export const MENSAJE_CAPTURA: MensajeEstado = conEtiqueta({
  titulo: "Micrófono activo",
  transcripcion: null,
  detalle: "El micrófono está capturando una instrucción.",
  tono: "neutro",
});

export const MENSAJE_PROCESANDO: MensajeEstado = conEtiqueta({
  titulo: "Procesando audio…",
  transcripcion: null,
  detalle: "El audio se está convirtiendo en texto.",
  tono: "neutro",
});

/**
 * Falla técnica de reconocimiento (tipo A del manual).
 *
 * No se afirma que la instrucción estuviera mal: el sistema no obtuvo una
 * transcripción confiable, que es otra cosa.
 */
export function mensajeFallaDeVoz(falla: FallaVoz): MensajeEstado {
  return conEtiqueta({
    titulo: "No se reconoció el audio",
    transcripcion: null,
    detalle: MENSAJE_FALLA[falla],
    tono: "atencion",
  });
}

/**
 * Compone el mensaje final de un intento.
 *
 * `resultado` es null cuando la instrucción no llegó a ejecutarse, es decir
 * cuando la interpretación no fue ejecutable.
 */
export function componerMensaje(
  entradaMostrada: string,
  interpretacion: Interpretacion,
  resultado: ResultadoEjecucion | null,
): MensajeEstado {
  const transcripcion = entradaMostrada.trim()
    ? `Se reconoció: “${entradaMostrada.trim()}”`
    : null;

  if (interpretacion.tipo === "SIN_TRANSCRIPCION") {
    return conEtiqueta({
      titulo: "No se reconoció el audio",
      transcripcion: null,
      detalle: interpretacion.detalle,
      tono: "atencion",
    });
  }

  if (interpretacion.tipo === "INFORMACION_INSUFICIENTE") {
    return conEtiqueta({
      titulo: "Información insuficiente",
      transcripcion,
      detalle: interpretacion.detalle,
      tono: "atencion",
    });
  }

  if (interpretacion.tipo === "FUERA_DEL_REPERTORIO") {
    return conEtiqueta({
      titulo: "Acción no disponible",
      transcripcion,
      detalle: interpretacion.detalle,
      tono: "atencion",
    });
  }

  // A partir de acá la instrucción fue reconocida y ejecutable.
  const accion = `Acción: ${interpretacion.descripcion}.`;

  if (!resultado) {
    return conEtiqueta({
      titulo: "Instrucción reconocida",
      transcripcion,
      detalle: accion,
      tono: "neutro",
    });
  }

  if (resultado.motivo === "META_ALCANZADA") {
    return conEtiqueta({
      titulo: "Destino alcanzado",
      transcripcion,
      detalle: `${accion} El dispositivo entró en el casillero de destino con el sobre.`,
      tono: "logro",
    });
  }

  // Tipo D: la acción fue reconocida, pero el entorno bloqueó el movimiento.
  if (resultado.motivo === "OBSTACULO" || resultado.motivo === "FUERA_DEL_TABLERO") {
    const causa =
      resultado.motivo === "OBSTACULO"
        ? "El siguiente movimiento encuentra un obstáculo."
        : "El siguiente movimiento sale del recorrido.";

    const pedidos = interpretacion.cantidad;
    const hechos = resultado.accionesAplicadas;
    const parcial =
      pedidos > 1
        ? ` Se ejecutaron ${hechos} de ${pedidos} movimientos.`
        : "";

    return conEtiqueta({
      titulo: "Movimiento bloqueado",
      transcripcion,
      detalle: `La acción fue reconocida.${parcial} ${causa}`,
      tono: "atencion",
    });
  }

  if (resultado.motivo === "DETENIDO") {
    return conEtiqueta({
      titulo: "Ejecución detenida",
      transcripcion,
      detalle: `${accion} La ejecución finalizó en el casillero actual.`,
      tono: "neutro",
    });
  }

  return conEtiqueta({
    titulo: "Instrucción reconocida",
    transcripcion,
    detalle: accion,
    tono: "neutro",
  });
}

/**
 * Resultado corto de un intento, para la columna "Resultado" del registro de
 * sesión (sección 11 del manual).
 */
export function resultadoParaRegistro(
  interpretacion: Interpretacion,
  resultado: ResultadoEjecucion | null,
): string {
  if (!resultado || interpretacion.tipo !== "EJECUTABLE") return "Sin movimiento";
  if (resultado.motivo === "META_ALCANZADA") return "Destino alcanzado";
  if (resultado.accionesAplicadas === 0) return "Sin movimiento";

  // Solo tiene sentido contar movimientos cuando se pidió más de un casillero.
  if (interpretacion.cantidad > 1) {
    const hechos = resultado.accionesAplicadas;
    return `Se ejecutaron ${hechos} de ${interpretacion.cantidad} ${
      interpretacion.cantidad === 1 ? "movimiento" : "movimientos"
    }`;
  }
  return "Acción ejecutada";
}

/**
 * Clasificación corta de un intento, para el registro de sesión que se usa en la
 * puesta en común.
 */
export function clasificacionParaRegistro(interpretacion: Interpretacion): string {
  switch (interpretacion.tipo) {
    case "EJECUTABLE":
      return "Ejecutable";
    case "INFORMACION_INSUFICIENTE":
      return "Información insuficiente";
    case "FUERA_DEL_REPERTORIO":
      return "Acción fuera del repertorio";
    case "SIN_TRANSCRIPCION":
      return "Falla de reconocimiento";
  }
}
