import { desc, eq } from 'drizzle-orm';
import { obtenerDb } from './db';
import { courses, type CursoEnBase } from './schema';
import type { CourseTheme, Lesson } from '@/types';

export const TEMA_POR_DEFECTO: CourseTheme = { primaryColor: '#6366f1', fontFamily: 'Inter' };

/** El editor manda el curso entero en cada PUT, `id` y timestamps incluidos. */
export interface CamposEditables {
  title?: string;
  description?: string;
  coverImage?: string;
  theme?: CourseTheme;
  lessons?: Lesson[];
  status?: 'draft' | 'published';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un id que no es UUID no puede existir en la tabla, pero si se lo pasáramos a
 * la query, Postgres tira error de tipo y el handler devuelve 500 en vez de 404.
 * Es la clase de bug que ya nos costó tiempo con ids malformados en la URL.
 */
export function esIdValido(id: string): boolean {
  return UUID.test(id);
}

/**
 * Deja pasar sólo los campos que el editor puede cambiar.
 *
 * Con Mongoose esto lo hacía el esquema: `findByIdAndUpdate` descartaba solo
 * las claves que no conocía. Drizzle no filtra nada, así que sin esta función
 * un PUT podría reescribir el `id` o falsear el `createdAt`.
 */
export function camposEditables(cuerpo: unknown): CamposEditables {
  if (typeof cuerpo !== 'object' || cuerpo === null) return {};
  const crudo = cuerpo as Record<string, unknown>;
  const campos: CamposEditables = {};

  if (typeof crudo.title === 'string') campos.title = crudo.title;
  if (typeof crudo.description === 'string') campos.description = crudo.description;
  if (typeof crudo.coverImage === 'string') campos.coverImage = crudo.coverImage;
  if (crudo.status === 'draft' || crudo.status === 'published') campos.status = crudo.status;
  if (Array.isArray(crudo.lessons)) campos.lessons = crudo.lessons as Lesson[];

  if (typeof crudo.theme === 'object' && crudo.theme !== null) {
    const tema = crudo.theme as Record<string, unknown>;
    campos.theme = {
      primaryColor:
        typeof tema.primaryColor === 'string' ? tema.primaryColor : TEMA_POR_DEFECTO.primaryColor,
      fontFamily:
        typeof tema.fontFamily === 'string' ? tema.fontFamily : TEMA_POR_DEFECTO.fontFamily,
    };
  }

  return campos;
}

export async function listarCursos(): Promise<CursoEnBase[]> {
  return obtenerDb().select().from(courses).orderBy(desc(courses.updatedAt));
}

export async function obtenerCurso(id: string): Promise<CursoEnBase | null> {
  if (!esIdValido(id)) return null;
  const [curso] = await obtenerDb().select().from(courses).where(eq(courses.id, id)).limit(1);
  return curso ?? null;
}

export async function crearCurso(cuerpo: unknown): Promise<CursoEnBase | null> {
  const campos = camposEditables(cuerpo);
  // El título es lo único obligatorio, igual que en el esquema de Mongo.
  if (!campos.title?.trim()) return null;

  const [curso] = await obtenerDb().insert(courses).values(campos as { title: string }).returning();
  return curso;
}

export async function actualizarCurso(id: string, cuerpo: unknown): Promise<CursoEnBase | null> {
  if (!esIdValido(id)) return null;
  const campos = camposEditables(cuerpo);
  if (Object.keys(campos).length === 0) return obtenerCurso(id);

  const [curso] = await obtenerDb()
    .update(courses)
    .set(campos)
    .where(eq(courses.id, id))
    .returning();
  return curso ?? null;
}

export async function borrarCurso(id: string): Promise<boolean> {
  if (!esIdValido(id)) return false;
  const borrados = await obtenerDb().delete(courses).where(eq(courses.id, id)).returning();
  return borrados.length > 0;
}
