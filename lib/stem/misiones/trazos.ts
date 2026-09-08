import { ACCIONES, type Accion } from "@/lib/stem/grid/tipos";

/**
 * Formato de los símbolos que dibuja la clase.
 *
 * Es un formato propio y acotado: listas de puntos normalizados entre 0 y 1.
 * No se acepta SVG ni HTML ingresado por el usuario, tal como exige la sección
 * 10.2 del manual. Lo que llega al servidor se vuelve a parsear y recortar
 * antes de guardarse, así que nunca se persiste una estructura arbitraria.
 */

/** Punto dentro del lienzo, en coordenadas relativas [0, 1]. */
export type Punto = [number, number];

/** Un trazo continuo: la secuencia de puntos entre apoyar y levantar el dedo. */
export type Trazo = Punto[];

/** El dibujo completo de un símbolo. */
export type Dibujo = Trazo[];

/** Los cuatro símbolos acordados por la clase. */
export type CodigoClase = Record<Accion, Dibujo>;

/* Topes de tamaño. Están para acotar lo que se guarda y lo que se dibuja, no
   para limitar lo que los chicos pueden hacer: son holgados para un símbolo. */
export const MAX_TRAZOS = 60;
export const MAX_PUNTOS_POR_TRAZO = 600;
export const MAX_PUNTOS_TOTALES = 4000;

/** Decimales que se conservan. Tres alcanzan de sobra para un lienzo en pantalla. */
const DECIMALES = 3;

function recortar(valor: number): number {
  const acotado = Math.min(1, Math.max(0, valor));
  return Number(acotado.toFixed(DECIMALES));
}

/**
 * Convierte un valor cualquiera en un dibujo válido, o devuelve null.
 *
 * Se usa en el servidor sobre el cuerpo de la petición: todo lo que no encaje
 * en el formato se descarta en lugar de guardarse.
 */
export function parsearDibujo(valor: unknown): Dibujo | null {
  if (!Array.isArray(valor)) return null;
  if (valor.length > MAX_TRAZOS) return null;

  const dibujo: Dibujo = [];
  let puntosTotales = 0;

  for (const trazoCrudo of valor) {
    if (!Array.isArray(trazoCrudo)) return null;
    if (trazoCrudo.length > MAX_PUNTOS_POR_TRAZO) return null;

    const trazo: Trazo = [];
    for (const puntoCrudo of trazoCrudo) {
      if (!Array.isArray(puntoCrudo) || puntoCrudo.length !== 2) return null;
      const [x, y] = puntoCrudo;
      if (typeof x !== "number" || typeof y !== "number") return null;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      trazo.push([recortar(x), recortar(y)]);
    }

    puntosTotales += trazo.length;
    if (puntosTotales > MAX_PUNTOS_TOTALES) return null;
    // Un trazo sin puntos no aporta nada al símbolo.
    if (trazo.length > 0) dibujo.push(trazo);
  }

  return dibujo;
}

/** Un símbolo está vacío si no tiene ningún punto dibujado. */
export function dibujoVacio(dibujo: Dibujo): boolean {
  return dibujo.every((trazo) => trazo.length === 0) || dibujo.length === 0;
}

/**
 * Parsea el código completo de la clase.
 *
 * Devuelve null si falta alguno de los cuatro símbolos o si alguno quedó vacío:
 * la aplicación no debe permitir guardar con un casillero en blanco.
 */
export function parsearCodigoClase(valor: unknown): CodigoClase | null {
  if (typeof valor !== "object" || valor === null) return null;
  const crudo = valor as Record<string, unknown>;

  const codigo = {} as CodigoClase;
  for (const accion of ACCIONES) {
    const dibujo = parsearDibujo(crudo[accion]);
    if (!dibujo || dibujoVacio(dibujo)) return null;
    codigo[accion] = dibujo;
  }
  return codigo;
}

/**
 * Convierte un dibujo en el atributo `d` de un path SVG.
 *
 * El path se arma acá a partir de números ya validados: nunca se interpola
 * texto que haya escrito el usuario.
 */
export function dibujoAPath(dibujo: Dibujo, lado: number): string {
  return dibujo
    .map((trazo) => {
      if (trazo.length === 0) return "";
      if (trazo.length === 1) {
        // Un punto suelto: se dibuja como un segmento mínimo para que se vea.
        const [x, y] = trazo[0];
        return `M ${x * lado} ${y * lado} l 0.01 0`;
      }
      const [primero, ...resto] = trazo;
      const inicio = `M ${primero[0] * lado} ${primero[1] * lado}`;
      const tramos = resto.map(([x, y]) => `L ${x * lado} ${y * lado}`).join(" ");
      return `${inicio} ${tramos}`;
    })
    .filter(Boolean)
    .join(" ");
}
