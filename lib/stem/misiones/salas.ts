import { and, asc, eq, gt, max } from "drizzle-orm";
import { obtenerDb } from "@/lib/stem/db";
import { misiones, salas, type FilaMision, type FilaSala } from "@/lib/stem/schema";
import type { Accion, Orientacion } from "@/lib/stem/grid/tipos";
import { generarCodigoCreacion, generarCodigoJuego } from "./codigos";
import type { CodigoClase } from "./trazos";
import type { ConfiguracionMision } from "./validacion";

/**
 * Acceso a las salas de clase.
 *
 * Toda operación que modifica una sala pasa por el código de creación. El
 * código de juego solo alcanza para leer, y nunca devuelve la secuencia del
 * grupo autor.
 */

/** Días de vida de una sala desde su último acceso (sección 2.3 del manual). */
export function diasDeVida(): number {
  const configurado = Number(process.env.SALA_TTL_DIAS);
  return Number.isFinite(configurado) && configurado > 0 ? configurado : 30;
}

function fechaDeCaducidad(desde = new Date()): Date {
  return new Date(desde.getTime() + diasDeVida() * 24 * 60 * 60 * 1000);
}

export interface SalaCreada {
  codigoCreacion: string;
  codigoJuego: string;
  caducaEn: Date;
}

/**
 * Crea la sala anónima de la clase con los cuatro símbolos ya dibujados.
 *
 * Los dos códigos se generan por separado: tener uno no permite deducir el otro.
 * Si el azar repitiera un código ya usado, se reintenta.
 */
export async function crearSala(simbolos: CodigoClase): Promise<SalaCreada> {
  const db = obtenerDb();

  for (let intento = 0; intento < 5; intento++) {
    const codigoCreacion = generarCodigoCreacion();
    const codigoJuego = generarCodigoJuego();
    const caducaEn = fechaDeCaducidad();

    try {
      await db.insert(salas).values({
        id: crypto.randomUUID(),
        codigoCreacion,
        codigoJuego,
        simbolos,
        caducaEn,
      });
      return { codigoCreacion, codigoJuego, caducaEn };
    } catch (error) {
      // Colisión de código: se vuelve a intentar con otros. Cualquier otra
      // falla se propaga.
      const mensaje = error instanceof Error ? error.message : "";
      if (!mensaje.includes("duplicate key")) throw error;
    }
  }

  throw new Error("No se pudo generar un código de sala disponible.");
}

/**
 * Busca una sala vigente por uno de sus dos códigos.
 *
 * Una sala caducada se comporta como inexistente: la persistencia es temporal.
 */
async function buscarSalaVigente(
  campo: "codigoCreacion" | "codigoJuego",
  codigo: string,
): Promise<FilaSala | null> {
  const db = obtenerDb();
  const columna = campo === "codigoCreacion" ? salas.codigoCreacion : salas.codigoJuego;

  const [fila] = await db
    .select()
    .from(salas)
    .where(and(eq(columna, codigo), gt(salas.caducaEn, new Date())))
    .limit(1);

  return fila ?? null;
}

/** Renueva la vigencia de la sala. Se llama en cada acceso. */
async function registrarAcceso(salaId: string): Promise<void> {
  const db = obtenerDb();
  const ahora = new Date();
  await db
    .update(salas)
    .set({ ultimoAcceso: ahora, caducaEn: fechaDeCaducidad(ahora) })
    .where(eq(salas.id, salaId));
}

export async function obtenerSalaParaEditar(codigo: string): Promise<FilaSala | null> {
  const sala = await buscarSalaVigente("codigoCreacion", codigo);
  if (sala) await registrarAcceso(sala.id);
  return sala;
}

export async function obtenerSalaParaJugar(codigo: string): Promise<FilaSala | null> {
  const sala = await buscarSalaVigente("codigoJuego", codigo);
  if (sala) await registrarAcceso(sala.id);
  return sala;
}

export async function borrarSala(salaId: string): Promise<void> {
  const db = obtenerDb();
  await db.delete(salas).where(eq(salas.id, salaId));
}

export async function listarMisiones(salaId: string): Promise<FilaMision[]> {
  const db = obtenerDb();
  return db
    .select()
    .from(misiones)
    .where(eq(misiones.salaId, salaId))
    .orderBy(asc(misiones.numero));
}

/** Tope de misiones por sala. Es un límite de sensatez, no una regla didáctica. */
export const MAX_MISIONES_POR_SALA = 30;

export async function crearMision(
  salaId: string,
  config: ConfiguracionMision,
  secuencia: Accion[],
): Promise<FilaMision | null> {
  const db = obtenerDb();

  const [{ mayor }] = await db
    .select({ mayor: max(misiones.numero) })
    .from(misiones)
    .where(eq(misiones.salaId, salaId));

  const numero = (mayor ?? 0) + 1;
  if (numero > MAX_MISIONES_POR_SALA) return null;

  const [fila] = await db
    .insert(misiones)
    .values({
      id: crypto.randomUUID(),
      salaId,
      numero,
      escenarioId: config.escenarioId,
      personaje: config.personaje,
      objetoMeta: config.objetoMeta,
      salidaFila: config.salida.fila,
      salidaColumna: config.salida.columna,
      orientacion: config.orientacion,
      metaFila: config.meta.fila,
      metaColumna: config.meta.columna,
      secuenciaAutora: secuencia,
      publicada: true,
    })
    .returning();

  return fila ?? null;
}

export async function borrarMision(salaId: string, misionId: string): Promise<void> {
  const db = obtenerDb();
  // El filtro por sala evita que un código de creación borre misiones de otra.
  await db.delete(misiones).where(and(eq(misiones.id, misionId), eq(misiones.salaId, salaId)));
}

/* ------------------------------------------------------------------------- */
/* Formas de salida                                                          */
/* ------------------------------------------------------------------------- */

export interface MisionPublica {
  id: string;
  numero: number;
  escenarioId: number;
  personaje: string;
  objetoMeta: string;
  salida: { fila: number; columna: number };
  orientacion: Orientacion;
  meta: { fila: number; columna: number };
}

/**
 * Versión de una misión para quien la juega.
 *
 * Deliberadamente NO incluye la secuencia del grupo autor: la sala de misiones
 * no muestra la solución antes del intento (sección 5.2 del manual).
 */
export function aMisionPublica(fila: FilaMision): MisionPublica {
  return {
    id: fila.id,
    numero: fila.numero,
    escenarioId: fila.escenarioId,
    personaje: fila.personaje,
    objetoMeta: fila.objetoMeta,
    salida: { fila: fila.salidaFila, columna: fila.salidaColumna },
    orientacion: fila.orientacion as Orientacion,
    meta: { fila: fila.metaFila, columna: fila.metaColumna },
  };
}

/** Versión para el modo de creación: agrega la cantidad de acciones de la solución. */
export function aMisionDeAutor(fila: FilaMision): MisionPublica & { accionesDeLaSolucion: number } {
  const secuencia = Array.isArray(fila.secuenciaAutora) ? fila.secuenciaAutora : [];
  return { ...aMisionPublica(fila), accionesDeLaSolucion: secuencia.length };
}
