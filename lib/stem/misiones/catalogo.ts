/**
 * Catálogo de personajes y objetos-meta del Creador de misiones.
 *
 * Sección 4.3 del manual: un conjunto chico (entre 4 y 6 de cada uno), la
 * personalización es solo visual y no altera las reglas de movimiento.
 *
 * Todos los personajes son dispositivos o vehículos con un frente claramente
 * distinguible. Ninguno tiene rostro ni puede expresar estados: la orientación
 * tiene que ser visualmente inequívoca y nada más.
 */

export interface OpcionCatalogo {
  id: string;
  nombre: string;
}

export const PERSONAJES: readonly OpcionCatalogo[] = [
  { id: "carrito", nombre: "Carrito" },
  { id: "dron", nombre: "Dron" },
  { id: "cohete", nombre: "Cohete" },
  { id: "tractor", nombre: "Tractor" },
  { id: "submarino", nombre: "Submarino" },
] as const;

export const OBJETOS_META: readonly OpcionCatalogo[] = [
  { id: "bandera", nombre: "Bandera" },
  { id: "casa", nombre: "Casa" },
  { id: "arbol", nombre: "Árbol" },
  { id: "pelota", nombre: "Pelota" },
  { id: "buzon", nombre: "Buzón" },
] as const;

export function esPersonajeValido(id: string): boolean {
  return PERSONAJES.some((p) => p.id === id);
}

export function esObjetoMetaValido(id: string): boolean {
  return OBJETOS_META.some((o) => o.id === id);
}

export function nombrePersonaje(id: string): string {
  return PERSONAJES.find((p) => p.id === id)?.nombre ?? "Dispositivo";
}

export function nombreObjetoMeta(id: string): string {
  return OBJETOS_META.find((o) => o.id === id)?.nombre ?? "Meta";
}
