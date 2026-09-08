import { expandirAvanzar } from "@/lib/stem/grid/motor";
import type { Accion } from "@/lib/stem/grid/tipos";
import {
  CANTIDADES_VAGAS,
  COMPLEMENTOS_ADELANTE,
  COMPLEMENTOS_DERECHA,
  COMPLEMENTOS_IZQUIERDA,
  DEICTICOS,
  EXPRESIONES_ATRAS,
  EXPRESIONES_MEDIA_VUELTA,
  NUMEROS_EN_PALABRAS,
  SUSTANTIVOS_OBJETIVO,
  TOPE_AVANZAR,
  UNIDADES,
  VERBOS_AVANZAR,
  VERBOS_DETENER,
  VERBOS_FUERA_DEL_REPERTORIO,
  VERBOS_GIRAR,
  VERBOS_OBJETIVO,
} from "./lexico";

/**
 * Módulo de interpretación de instrucciones del Robot mensajero.
 *
 * Convierte una frase (dictada o escrita) en una acción del repertorio, o
 * explica por qué no puede convertirla. La entrada escrita y la voz transcripta
 * atraviesan exactamente este mismo módulo, así que producen el mismo resultado.
 *
 * Las cuatro categorías de salida se corresponden con la sección 8 del manual:
 *  A. falla de reconocimiento  → SIN_TRANSCRIPCION
 *  B. reconocida pero ambigua  → INFORMACION_INSUFICIENTE
 *  C. fuera del repertorio     → FUERA_DEL_REPERTORIO
 *  D. bloqueada por el entorno → la decide el motor de grilla, no este módulo
 */

export type MotivoInsuficiente =
  | "DIRECCION_DEICTICA"
  | "SENALAMIENTO"
  | "GIRO_SIN_DIRECCION"
  | "SIN_ACCION_NI_DISTANCIA"
  | "FALTA_ACCION"
  | "MOVIMIENTO_CON_DIRECCION_DE_GIRO"
  | "OBJETIVO_SIN_MOVIMIENTO"
  | "SIN_INFORMACION";

export type MotivoFueraDelRepertorio =
  | "ACCION_NO_PREVISTA"
  | "RETROCEDER"
  | "MEDIA_VUELTA"
  | "CANTIDAD_FUERA_DE_RANGO"
  | "MAS_DE_UNA_ACCION";

export type Interpretacion =
  | {
      tipo: "EJECUTABLE";
      /** Nombre canónico, para el registro de sesión. */
      canonica: "AVANZAR_1" | "AVANZAR_N" | "GIRO_DERECHA_90" | "GIRO_IZQUIERDA_90" | "DETENER";
      /** Acciones a ejecutar, ya expandidas paso a paso. */
      acciones: Accion[];
      cantidad: number;
      /** Descripción de la acción aplicada, para el panel de estado. */
      descripcion: string;
      textoNormalizado: string;
    }
  | {
      tipo: "INFORMACION_INSUFICIENTE";
      motivo: MotivoInsuficiente;
      detalle: string;
      textoNormalizado: string;
    }
  | {
      tipo: "FUERA_DEL_REPERTORIO";
      motivo: MotivoFueraDelRepertorio;
      detalle: string;
      textoNormalizado: string;
    }
  | {
      tipo: "SIN_TRANSCRIPCION";
      detalle: string;
      textoNormalizado: "";
    };

/**
 * Deja el texto en minúsculas, sin tildes, sin signos y con espacios simples.
 *
 * Requisito RF-04: las tildes, mayúsculas, signos y variantes de transcripción
 * no deben impedir el reconocimiento. "gira", "girá" y "GIRA" son equivalentes.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    // Marcas diacríticas combinantes: es lo que deja la descomposición NFD.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Busca una palabra o frase completa dentro del texto ya normalizado. */
function contiene(textoNormalizado: string, expresion: string): boolean {
  const objetivo = normalizar(expresion);
  if (!objetivo) return false;
  return ` ${textoNormalizado} `.includes(` ${objetivo} `);
}

function contieneAlguna(
  textoNormalizado: string,
  expresiones: readonly string[],
): boolean {
  return expresiones.some((e) => contiene(textoNormalizado, e));
}

/**
 * Saca del texto los grados de un giro, para que "90" no se confunda con una
 * cantidad de casilleros. "girá 90 grados a tu derecha" gira, no avanza 90.
 */
function sinGrados(textoNormalizado: string): string {
  return textoNormalizado
    .replace(/\b\d+\s+grados\b/g, " ")
    .replace(/\bnoventa\s+grados\b/g, " ")
    .replace(/\bciento\s+ochenta\s+grados\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Palabras que convierten al número anterior en un determinante y no en una
 * cantidad de casilleros: "un giro", "una vuelta", "un poquito".
 */
const NO_CUENTAN_CASILLEROS = new Set([
  "giro",
  "giros",
  "vuelta",
  "vueltas",
  "grado",
  "grados",
  "poquito",
  "poco",
  "cachito",
  "toque",
  "rato",
  "vez",
  "veces",
]);

/**
 * Extrae la cantidad de casilleros, en número o en palabra.
 *
 * Devuelve null si la frase no trae ninguna cantidad: en ese caso el comando
 * simple "avanzá" asume 1, tal como define la acción canónica AVANZAR_1.
 */
export function extraerCantidad(textoNormalizado: string): number | null {
  const limpio = sinGrados(textoNormalizado);
  const palabras = limpio.split(" ").filter(Boolean);

  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];
    const valor = /^\d+$/.test(palabra)
      ? Number(palabra)
      : NUMEROS_EN_PALABRAS[palabra];
    if (valor === undefined) continue;

    // "hacé un giro", "un poquito": el número acompaña a otra cosa, no cuenta
    // casilleros. Se sigue buscando por si más adelante hay una cantidad real.
    if (NO_CUENTAN_CASILLEROS.has(palabras[i + 1] ?? "")) continue;

    return valor;
  }
  return null;
}

function resultadoInsuficiente(
  textoNormalizado: string,
  motivo: MotivoInsuficiente,
  detalle: string,
): Interpretacion {
  return { tipo: "INFORMACION_INSUFICIENTE", motivo, detalle, textoNormalizado };
}

function resultadoFuera(
  textoNormalizado: string,
  motivo: MotivoFueraDelRepertorio,
  detalle: string,
): Interpretacion {
  return { tipo: "FUERA_DEL_REPERTORIO", motivo, detalle, textoNormalizado };
}

/**
 * Interpreta una frase y devuelve la acción a ejecutar o el motivo por el que no
 * se puede ejecutar.
 *
 * El orden de las reglas importa: los verbos de giro se evalúan antes que los de
 * avance, y los de detención al final, porque "para" es a la vez un verbo y una
 * preposición ("andá para allá" no es una orden de detenerse).
 */
export function interpretar(entrada: string): Interpretacion {
  const texto = normalizar(entrada ?? "");

  if (!texto) {
    return {
      tipo: "SIN_TRANSCRIPCION",
      detalle: "No se pudo reconocer lo dicho. Probá nuevamente o escribí la instrucción.",
      textoNormalizado: "",
    };
  }

  const hayAvanzar = contieneAlguna(texto, VERBOS_AVANZAR);
  const hayGirar = contieneAlguna(texto, VERBOS_GIRAR);
  const hayDerecha = contieneAlguna(texto, COMPLEMENTOS_DERECHA);
  const hayIzquierda = contieneAlguna(texto, COMPLEMENTOS_IZQUIERDA);
  const hayAdelante = contieneAlguna(texto, COMPLEMENTOS_ADELANTE);
  const hayDeictico = contieneAlguna(texto, DEICTICOS);
  const hayAtras = contieneAlguna(texto, EXPRESIONES_ATRAS);
  const hayMediaVuelta = contieneAlguna(texto, EXPRESIONES_MEDIA_VUELTA);

  // Media vuelta y retroceder quedaron fuera de la primera versión (sección 20).
  // Se reconocen para poder informarlo, no para inferir un equivalente.
  if (hayMediaVuelta) {
    return resultadoFuera(
      texto,
      "MEDIA_VUELTA",
      "Esta acción no está prevista en este sistema.",
    );
  }
  if (hayAtras) {
    return resultadoFuera(
      texto,
      "RETROCEDER",
      "Esta acción no está prevista en este sistema.",
    );
  }

  // Una instrucción por vez: dos acciones distintas en la misma frase no se
  // parten automáticamente, porque eso sería completar una decisión ajena.
  if (hayGirar && hayAvanzar) {
    return resultadoFuera(
      texto,
      "MAS_DE_UNA_ACCION",
      "Esta instrucción contiene más de una acción. El sistema ejecuta una acción por vez.",
    );
  }

  if (hayGirar) {
    if (hayDerecha && hayIzquierda) {
      return resultadoInsuficiente(
        texto,
        "GIRO_SIN_DIRECCION",
        "La instrucción indica los dos lados. Falta un solo lado hacia el cual girar.",
      );
    }
    if (hayDerecha) {
      return {
        tipo: "EJECUTABLE",
        canonica: "GIRO_DERECHA_90",
        acciones: ["GIRO_DERECHA_90"],
        cantidad: 1,
        descripcion: "giro de 90° a la derecha",
        textoNormalizado: texto,
      };
    }
    if (hayIzquierda) {
      return {
        tipo: "EJECUTABLE",
        canonica: "GIRO_IZQUIERDA_90",
        acciones: ["GIRO_IZQUIERDA_90"],
        cantidad: 1,
        descripcion: "giro de 90° a la izquierda",
        textoNormalizado: texto,
      };
    }
    // "doblá acá" + señalamiento: la frase llegó, el gesto no.
    if (hayDeictico) {
      return resultadoInsuficiente(
        texto,
        "SENALAMIENTO",
        "El sistema recibió la frase, pero no el señalamiento.",
      );
    }
    return resultadoInsuficiente(
      texto,
      "GIRO_SIN_DIRECCION",
      "Falta indicar hacia qué lado girar.",
    );
  }

  if (hayAvanzar) {
    // "andá para allá": hay un movimiento, pero la dirección es deíctica.
    if (hayDeictico && !hayAdelante) {
      return resultadoInsuficiente(
        texto,
        "DIRECCION_DEICTICA",
        "Falta una dirección que el sistema pueda usar.",
      );
    }
    // "andá a la derecha": el sistema puede girar a la derecha o avanzar hacia
    // adelante, pero no combina las dos cosas en una sola instrucción.
    if ((hayDerecha || hayIzquierda) && !hayAdelante) {
      return resultadoInsuficiente(
        texto,
        "MOVIMIENTO_CON_DIRECCION_DE_GIRO",
        "El sistema puede avanzar hacia adelante o girar hacia un lado, pero no las dos cosas en una misma instrucción.",
      );
    }
    if (contieneAlguna(texto, SUSTANTIVOS_OBJETIVO) && !hayAdelante && extraerCantidad(texto) === null) {
      return resultadoInsuficiente(
        texto,
        "OBJETIVO_SIN_MOVIMIENTO",
        "Se reconoció la meta, pero falta indicar un movimiento que el sistema pueda ejecutar.",
      );
    }
    return construirAvance(texto);
  }

  // Movimiento expresado solo con el complemento: "para adelante", "derecho".
  if (hayAdelante) {
    if (hayDeictico) {
      return resultadoInsuficiente(
        texto,
        "DIRECCION_DEICTICA",
        "Falta una dirección que el sistema pueda usar.",
      );
    }
    return construirAvance(texto);
  }

  // La meta de la misión no es un comando de movimiento.
  if (
    contieneAlguna(texto, VERBOS_OBJETIVO) &&
    contieneAlguna(texto, SUSTANTIVOS_OBJETIVO)
  ) {
    return resultadoInsuficiente(
      texto,
      "OBJETIVO_SIN_MOVIMIENTO",
      "Se reconoció la meta, pero falta indicar un movimiento que el sistema pueda ejecutar.",
    );
  }

  // Acciones claras pero que no existen en este repertorio.
  if (contieneAlguna(texto, VERBOS_FUERA_DEL_REPERTORIO)) {
    return resultadoFuera(
      texto,
      "ACCION_NO_PREVISTA",
      "Esta acción no está prevista en este sistema.",
    );
  }

  // "pará", "frená", "quedate ahí". Va después de avanzar y girar porque "para"
  // también funciona como preposición.
  if (contieneAlguna(texto, VERBOS_DETENER)) {
    return {
      tipo: "EJECUTABLE",
      canonica: "DETENER",
      acciones: ["DETENER"],
      cantidad: 1,
      descripcion: "detener la ejecución",
      textoNormalizado: texto,
    };
  }

  // "un poquito más": ni acción ni distancia utilizable.
  if (contieneAlguna(texto, CANTIDADES_VAGAS)) {
    return resultadoInsuficiente(
      texto,
      "SIN_ACCION_NI_DISTANCIA",
      "Falta indicar una acción y una distancia que el sistema pueda ejecutar.",
    );
  }

  // Solo una dirección o solo una cantidad, sin ninguna acción.
  if (hayDerecha || hayIzquierda) {
    return resultadoInsuficiente(
      texto,
      "FALTA_ACCION",
      "Se reconoció una dirección, pero falta indicar qué acción realizar.",
    );
  }
  if (extraerCantidad(texto) !== null || contieneAlguna(texto, UNIDADES)) {
    return resultadoInsuficiente(
      texto,
      "FALTA_ACCION",
      "Se reconoció una cantidad, pero falta indicar qué acción realizar.",
    );
  }
  if (hayDeictico) {
    return resultadoInsuficiente(
      texto,
      "DIRECCION_DEICTICA",
      "Falta una dirección que el sistema pueda usar.",
    );
  }

  return resultadoInsuficiente(
    texto,
    "SIN_INFORMACION",
    "Falta información para realizar una acción.",
  );
}

/** Arma la acción de avance, resolviendo la cantidad y su tope. */
function construirAvance(texto: string): Interpretacion {
  const cantidadDeclarada = extraerCantidad(texto);

  // Sin cantidad explícita, el comando simple asume un casillero (AVANZAR_1).
  const cantidad = cantidadDeclarada ?? 1;

  if (cantidad < 1) {
    return resultadoInsuficiente(
      texto,
      "SIN_ACCION_NI_DISTANCIA",
      "Falta indicar una acción y una distancia que el sistema pueda ejecutar.",
    );
  }

  if (cantidad > TOPE_AVANZAR) {
    return resultadoFuera(
      texto,
      "CANTIDAD_FUERA_DE_RANGO",
      `El sistema puede avanzar entre 1 y ${TOPE_AVANZAR} casilleros por instrucción.`,
    );
  }

  return {
    tipo: "EJECUTABLE",
    canonica: cantidad === 1 ? "AVANZAR_1" : "AVANZAR_N",
    acciones: expandirAvanzar(cantidad),
    cantidad,
    descripcion:
      cantidad === 1 ? "avanzar 1 casillero" : `avanzar ${cantidad} casilleros`,
    textoNormalizado: texto,
  };
}
