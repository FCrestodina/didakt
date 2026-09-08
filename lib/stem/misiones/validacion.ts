import { analizarMision } from "@/lib/stem/grid/analisis";
import { celdaTransitable, ejecutarSecuencia, mismaCelda } from "@/lib/stem/grid/motor";
import {
  ACCIONES,
  ORIENTACIONES,
  type Accion,
  type Celda,
  type Orientacion,
} from "@/lib/stem/grid/tipos";
import { esObjetoMetaValido, esPersonajeValido } from "./catalogo";
import { ESCENARIOS, escenarioPorId } from "./tableros";

/**
 * Validación de una misión antes de guardarla.
 *
 * Se ejecuta en el cliente para guiar al grupo autor mientras arma la misión, y
 * otra vez en el servidor antes de persistir: la sección 10.2 del manual pide
 * validar en los dos lados toda operación que modifique una sala.
 */

/** Extensión máxima de una secuencia para Primer Ciclo (sección 4.4). */
export const MAX_ACCIONES = 12;

export interface ConfiguracionMision {
  escenarioId: number;
  personaje: string;
  objetoMeta: string;
  salida: Celda;
  orientacion: Orientacion;
  meta: Celda;
}

export interface ProblemaValidacion {
  campo: "escenario" | "personaje" | "objetoMeta" | "salida" | "meta" | "secuencia";
  mensaje: string;
}

function esOrientacion(valor: unknown): valor is Orientacion {
  return typeof valor === "string" && (ORIENTACIONES as readonly string[]).includes(valor);
}

function esAccion(valor: unknown): valor is Accion {
  return typeof valor === "string" && (ACCIONES as readonly string[]).includes(valor);
}

function esCelda(valor: unknown): valor is Celda {
  if (typeof valor !== "object" || valor === null) return false;
  const c = valor as Record<string, unknown>;
  return (
    typeof c.fila === "number" &&
    typeof c.columna === "number" &&
    Number.isInteger(c.fila) &&
    Number.isInteger(c.columna)
  );
}

/**
 * Revisa la configuración del tablero y devuelve todos los problemas
 * encontrados. Una lista vacía significa que la misión se puede armar.
 */
export function validarConfiguracion(config: ConfiguracionMision): ProblemaValidacion[] {
  const problemas: ProblemaValidacion[] = [];

  const escenario = ESCENARIOS.find((e) => e.id === config.escenarioId);
  if (!escenario) {
    return [{ campo: "escenario", mensaje: "Elegí uno de los escenarios disponibles." }];
  }
  const tablero = escenario.tablero;

  if (!esPersonajeValido(config.personaje)) {
    problemas.push({ campo: "personaje", mensaje: "Elegí un personaje de la lista." });
  }
  if (!esObjetoMetaValido(config.objetoMeta)) {
    problemas.push({ campo: "objetoMeta", mensaje: "Elegí un objeto para la meta." });
  }

  // La app debe impedir configuraciones imposibles (sección 4.2).
  if (!celdaTransitable(tablero, config.salida)) {
    problemas.push({
      campo: "salida",
      mensaje: "El punto de partida tiene que estar en un casillero libre del tablero.",
    });
  }
  if (!celdaTransitable(tablero, config.meta)) {
    problemas.push({
      campo: "meta",
      mensaje: "La meta tiene que estar en un casillero libre del tablero.",
    });
  }
  if (mismaCelda(config.salida, config.meta)) {
    problemas.push({
      campo: "meta",
      mensaje: "La meta no puede estar en el mismo casillero que la salida.",
    });
  }

  // Sin ubicaciones válidas no tiene sentido seguir analizando el recorrido.
  if (problemas.some((p) => p.campo === "salida" || p.campo === "meta")) {
    return problemas;
  }

  const analisis = analizarMision(
    tablero,
    { celda: config.salida, orientacion: config.orientacion },
    config.meta,
  );

  if (!analisis.alcanzable) {
    problemas.push({
      campo: "meta",
      mensaje: "Desde esa salida no hay forma de llegar a la meta. Probá otra ubicación.",
    });
    return problemas;
  }

  // Evitar misiones triviales: si se resuelve con una sola acción o sin ningún
  // giro, se pide elegir otra ubicación.
  if (analisis.trivial) {
    problemas.push({
      campo: "meta",
      mensaje:
        "Esta misión se resuelve avanzando derecho, sin ningún giro. Probá otra ubicación para que haya que cambiar de dirección.",
    });
  }

  return problemas;
}

/**
 * Revisa que la secuencia del grupo autor efectivamente resuelva la misión.
 *
 * No se compara contra una secuencia modelo: lo único que se comprueba es que
 * esta llegue a la meta respetando las reglas. Es la garantía de que la misión
 * publicada tiene al menos una solución.
 */
export function validarSecuenciaAutora(
  config: ConfiguracionMision,
  secuencia: readonly Accion[],
): ProblemaValidacion[] {
  if (secuencia.length === 0) {
    return [
      {
        campo: "secuencia",
        mensaje: "Armá una secuencia con los símbolos del código y probala antes de guardar.",
      },
    ];
  }
  if (secuencia.length > MAX_ACCIONES) {
    return [
      {
        campo: "secuencia",
        mensaje: `La secuencia puede tener hasta ${MAX_ACCIONES} acciones.`,
      },
    ];
  }

  const escenario = escenarioPorId(config.escenarioId);
  const resultado = ejecutarSecuencia(
    escenario.tablero,
    { celda: config.salida, orientacion: config.orientacion },
    config.meta,
    secuencia,
  );

  if (!resultado.exito) {
    return [
      {
        campo: "secuencia",
        mensaje: "Esta secuencia todavía no llega a la meta. Revisala y volvé a probar.",
      },
    ];
  }
  return [];
}

/**
 * Parsea y valida el cuerpo de la petición de alta de una misión.
 *
 * Devuelve la configuración ya tipada o la lista de problemas. Todo lo que
 * llega de la red pasa por acá antes de tocar la base.
 */
export function parsearMision(
  cuerpo: unknown,
): { ok: true; config: ConfiguracionMision; secuencia: Accion[] } | { ok: false; problemas: ProblemaValidacion[] } {
  if (typeof cuerpo !== "object" || cuerpo === null) {
    return { ok: false, problemas: [{ campo: "escenario", mensaje: "Petición inválida." }] };
  }
  const c = cuerpo as Record<string, unknown>;

  if (
    typeof c.escenarioId !== "number" ||
    typeof c.personaje !== "string" ||
    typeof c.objetoMeta !== "string" ||
    !esCelda(c.salida) ||
    !esCelda(c.meta) ||
    !esOrientacion(c.orientacion) ||
    !Array.isArray(c.secuencia) ||
    !c.secuencia.every(esAccion)
  ) {
    return { ok: false, problemas: [{ campo: "escenario", mensaje: "Petición inválida." }] };
  }

  const config: ConfiguracionMision = {
    escenarioId: c.escenarioId,
    personaje: c.personaje,
    objetoMeta: c.objetoMeta,
    salida: { fila: c.salida.fila, columna: c.salida.columna },
    orientacion: c.orientacion,
    meta: { fila: c.meta.fila, columna: c.meta.columna },
  };
  const secuencia = c.secuencia as Accion[];

  const problemas = [
    ...validarConfiguracion(config),
    ...validarSecuenciaAutora(config, secuencia),
  ];
  if (problemas.length > 0) return { ok: false, problemas };

  return { ok: true, config, secuencia };
}
