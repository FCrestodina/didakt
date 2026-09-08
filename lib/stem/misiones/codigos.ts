/**
 * Códigos de acceso a una sala.
 *
 * Cada sala tiene dos códigos distintos (sección 2.1 del manual):
 *  - Código de creación: recupera el código de la clase y permite crear y
 *    editar misiones. Lo usan el docente y los grupos durante la producción.
 *  - Código de juego: abre la sala publicada en modo solo juego. Nunca habilita
 *    editar ni borrar.
 *
 * Son aleatorios y no se derivan uno del otro: tener el código de juego no
 * permite deducir el de creación.
 */

/**
 * Alfabeto sin caracteres que se confunden al leerlos en voz alta o copiarlos
 * de un pizarrón: se sacaron 0, O, 1, I y L.
 */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** El código de creación es más largo porque no hace falta dictarlo en el aula. */
export const LARGO_CODIGO_CREACION = 10;
export const LARGO_CODIGO_JUEGO = 8;

/**
 * Genera un código aleatorio de la longitud pedida.
 *
 * Usa el generador criptográfico del entorno y descarta los bytes que caerían
 * fuera del último bloque completo del alfabeto, para que todos los caracteres
 * tengan la misma probabilidad.
 */
export function generarCodigo(largo: number): string {
  const limite = Math.floor(256 / ALFABETO.length) * ALFABETO.length;
  let codigo = "";

  while (codigo.length < largo) {
    const bytes = new Uint8Array(largo * 2);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limite) continue;
      codigo += ALFABETO[byte % ALFABETO.length];
      if (codigo.length === largo) break;
    }
  }
  return codigo;
}

export function generarCodigoCreacion(): string {
  return generarCodigo(LARGO_CODIGO_CREACION);
}

export function generarCodigoJuego(): string {
  return generarCodigo(LARGO_CODIGO_JUEGO);
}

/**
 * Normaliza un código escrito a mano: mayúsculas y sin espacios ni guiones,
 * que es como suele quedar cuando se copia de un pizarrón o de un papel.
 */
export function normalizarCodigo(entrada: string): string {
  return (entrada ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** ¿El texto tiene la forma de un código de esta aplicación? */
export function esCodigoValido(entrada: string, largo: number): boolean {
  const codigo = normalizarCodigo(entrada);
  if (codigo.length !== largo) return false;
  return [...codigo].every((c) => ALFABETO.includes(c));
}

/** Muestra el código en bloques de cuatro, para que sea más fácil de leer. */
export function formatearCodigo(codigo: string): string {
  return (codigo.match(/.{1,4}/g) ?? [codigo]).join(" ");
}
