import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import type { CourseTheme, Lesson } from '@/types';

/**
 * Secuencias armadas con el editor de bloques.
 *
 * `lessons` va como `jsonb`: es el equivalente exacto de cómo vivían en Mongo
 * (el subdocumento de bloques tenía `strict: false`, o sea JSON crudo). La
 * fuente de verdad de la forma de un bloque siguen siendo los tipos de
 * `types/index.ts`, no el esquema de la base — igual que antes.
 */
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    coverImage: text('cover_image').notNull().default(''),
    theme: jsonb('theme')
      .$type<CourseTheme>()
      .notNull()
      .default({ primaryColor: '#6366f1', fontFamily: 'Inter' }),
    lessons: jsonb('lessons').$type<Lesson[]>().notNull().default([]),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // $onUpdate lo bumpea solo en cada UPDATE. Mongoose lo hacía por
    // `timestamps: true`; el panel muestra "hace X min" con este campo, así que
    // si se dejara al handler acordarse, se rompería en el primer olvido.
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (tabla) => [index('courses_updated_at_idx').on(tabla.updatedAt)],
);

export type CursoEnBase = typeof courses.$inferSelect;
