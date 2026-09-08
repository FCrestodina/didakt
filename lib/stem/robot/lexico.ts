/**
 * Léxico del Robot mensajero.
 *
 * Sale de la sección 6.2 del manual ("Variantes lingüísticas mínimas a
 * contemplar") más las variantes morfológicas obvias de cada verbo. La regla de
 * oro del recurso: flexible con las palabras, estricto con la información.
 *
 * No hay IA generativa acá. Es normalización de texto + detección de familias de
 * expresiones equivalentes, exactamente como habilita la sección 6 del manual.
 */

/** Verbos y expresiones que expresan desplazamiento hacia adelante. */
export const VERBOS_AVANZAR = [
  "avanza",
  "avanzá",
  "avanzar",
  "avanzo",
  "avance",
  "segui",
  "seguí",
  "sigue",
  "seguir",
  "anda",
  "andá",
  "andar",
  "ve",
  "movete",
  "muevete",
  "mover",
  "moverte",
  "desplazate",
  "desplazarte",
  "camina",
  "caminá",
  "caminar",
] as const;

/** Verbos y expresiones que expresan un giro, sin decir todavía hacia qué lado. */
export const VERBOS_GIRAR = [
  "gira",
  "girá",
  "girar",
  "giro",
  "gire",
  "dobla",
  "doblá",
  "doblar",
  "rota",
  "rotá",
  "rotar",
  "da vuelta",
  "dar vuelta",
  "date vuelta",
  "hace un giro",
  "hacé un giro",
  "haces un giro",
  "hacer un giro",
] as const;

/** Verbos y expresiones que piden detener el movimiento. */
export const VERBOS_DETENER = [
  "para",
  "pará",
  "parar",
  "pare",
  "frena",
  "frená",
  "frenar",
  "detente",
  "detenete",
  "detener",
  "deteni",
  "quedate",
  "quieto",
  "alto",
  "stop",
] as const;

/** Complementos que indican el lado del giro. */
export const COMPLEMENTOS_DERECHA = [
  "derecha",
  "a la derecha",
  "hacia la derecha",
  "a tu derecha",
  "hacia tu derecha",
] as const;

export const COMPLEMENTOS_IZQUIERDA = [
  "izquierda",
  "a la izquierda",
  "hacia la izquierda",
  "a tu izquierda",
  "hacia tu izquierda",
] as const;

/**
 * Complementos que indican movimiento hacia adelante.
 *
 * Ojo con "derecho" (recto) frente a "derecha" (lado): son palabras distintas y
 * el sistema no las puede confundir. "seguí derecho" avanza; "seguí a la
 * derecha" no es lo mismo.
 */
export const COMPLEMENTOS_ADELANTE = [
  "adelante",
  "hacia adelante",
  "para adelante",
  "derecho",
  "recto",
  "de frente",
] as const;

/** Expresiones que piden retroceder: fuera del repertorio de la primera versión. */
export const EXPRESIONES_ATRAS = [
  "atras",
  "atrás",
  "para atras",
  "hacia atras",
  "retrocede",
  "retrocedé",
  "retroceder",
  "reversa",
  "marcha atras",
  "volve",
  "volvé",
] as const;

/** Giro de 180 grados: fuera del repertorio de la primera versión. */
export const EXPRESIONES_MEDIA_VUELTA = [
  "media vuelta",
  "180 grados",
  "ciento ochenta grados",
  "date la vuelta",
] as const;

/**
 * Deícticos: señalan un lugar que solo se resuelve con el contexto, la mirada o
 * el gesto. Son el corazón del diagnóstico: el sistema recibe la frase, no el
 * señalamiento.
 */
export const DEICTICOS = [
  "alla",
  "allá",
  "aca",
  "acá",
  "ahi",
  "ahí",
  "alli",
  "allí",
  "por ahi",
  "por ahí",
  "para alla",
  "para allá",
  "ese lado",
  "este lado",
  "ahi mismo",
] as const;

/** Cantidades vagas: no se pueden convertir en un número de casilleros. */
export const CANTIDADES_VAGAS = [
  "poquito",
  "poco",
  "cachito",
  "toque",
  "mas",
  "más",
  "bastante",
  "mucho",
  "un rato",
] as const;

/** Sustantivos que cuentan casilleros. */
export const UNIDADES = [
  "casillero",
  "casilleros",
  "casilla",
  "casillas",
  "cuadro",
  "cuadros",
  "paso",
  "pasos",
  "lugar",
  "lugares",
] as const;

/** Números escritos en palabras. Se aceptan más allá del tope para poder avisar. */
export const NUMEROS_EN_PALABRAS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

/**
 * Acciones que la frase expresa con claridad pero que el robot no tiene
 * programadas. No se simula que "no sabe" ni que "no quiere": simplemente no
 * están previstas en este sistema.
 */
export const VERBOS_FUERA_DEL_REPERTORIO = [
  "ponete",
  "ponte",
  "poner",
  "acercate",
  "acerca",
  "acercar",
  "alejate",
  "alejar",
  "ubicate",
  "ubica",
  "agarra",
  "agarrá",
  "agarrar",
  "levanta",
  "levantá",
  "levantar",
  "toma",
  "tomá",
  "tomar",
  "solta",
  "soltá",
  "soltar",
  "abri",
  "abrí",
  "abrir",
  "cerra",
  "cerrá",
  "cerrar",
  "espera",
  "esperá",
  "esperar",
  "salta",
  "saltá",
  "saltar",
  "busca",
  "buscá",
  "buscar",
  "encontra",
  "encontrá",
  "toca",
  "tocá",
  "tocar",
  "cerca de",
  "al lado de",
  "arriba de",
  "abajo de",
] as const;

/** Verbos que expresan la meta de la misión, no un movimiento ejecutable. */
export const VERBOS_OBJETIVO = [
  "lleva",
  "llevá",
  "llevar",
  "entrega",
  "entregá",
  "entregar",
  "reparti",
  "repartí",
  "repartir",
  "deja",
  "dejá",
  "dejar",
  "alcanza",
  "alcanzá",
  "manda",
  "mandá",
] as const;

/** Objetos y destinos que aparecen cuando se enuncia la meta de la misión. */
export const SUSTANTIVOS_OBJETIVO = [
  "sobre",
  "carta",
  "mensaje",
  "paquete",
  "encomienda",
  "biblioteca",
  "aula",
  "direccion",
  "dirección",
  "secretaria",
  "secretaría",
  "puerta",
  "destino",
  "sala",
] as const;

/** Tope de casilleros por instrucción (manual, sección 20). */
export const TOPE_AVANZAR = 5;
