import type { ResultadoEjecucion } from "@/lib/stem/grid/tipos";

/**
 * Mensajes de la ejecución de una secuencia (sección 4.6 del manual).
 *
 * Describen lo que hizo el sistema, sin atribuirle intención al personaje.
 * Nunca dicen que la respuesta esté "mal": una secuencia que no llega es una
 * secuencia que se puede revisar y volver a probar.
 */

export type TonoResultado = "logro" | "revisar";

export interface MensajeResultado {
  titulo: string;
  detalle: string;
  tono: TonoResultado;
  /** Etiqueta en texto del tono, para no depender solo del color. */
  etiqueta: string;
}

export function mensajeDeEjecucion(resultado: ResultadoEjecucion): MensajeResultado {
  switch (resultado.motivo) {
    case "META_ALCANZADA":
      return {
        titulo: "Llegaste a la meta",
        detalle: `La secuencia resolvió la misión en ${resultado.accionesAplicadas} ${
          resultado.accionesAplicadas === 1 ? "acción" : "acciones"
        }.`,
        tono: "logro",
        etiqueta: "Misión resuelta",
      };

    case "OBSTACULO":
      return {
        titulo: "El siguiente movimiento encuentra un obstáculo",
        detalle: "La ejecución se detuvo antes de ocupar esa celda. Podés revisar la secuencia y volver a probar.",
        tono: "revisar",
        etiqueta: "Para revisar",
      };

    case "FUERA_DEL_TABLERO":
      return {
        titulo: "El siguiente movimiento sale del recorrido",
        detalle: "La ejecución se detuvo en el borde del tablero. Podés revisar la secuencia y volver a probar.",
        tono: "revisar",
        etiqueta: "Para revisar",
      };

    case "DETENIDO":
      return {
        titulo: "La secuencia se detuvo antes de llegar a la meta",
        detalle: "El símbolo de detenerse termina la ejecución donde está.",
        tono: "revisar",
        etiqueta: "Para revisar",
      };

    case "SECUENCIA_COMPLETA":
      return {
        titulo: "La secuencia terminó acá",
        detalle: "Podés revisarla, cambiar el orden, agregar o sacar instrucciones y volver a probar.",
        tono: "revisar",
        etiqueta: "Para revisar",
      };
  }
}
