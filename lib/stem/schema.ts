import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Esquema del Creador de misiones.
 *
 * La unidad de persistencia es la sala de clase, no el estudiante (sección 2
 * del manual). No hay tabla de usuarios y no se guarda ningún dato personal:
 * ni nombres, ni correos, ni curso, ni escuela, ni edad, ni audio, ni fotos.
 *
 * El Robot mensajero no usa esta base: su historial vive solo en la sesión del
 * navegador y se borra al recargar.
 */

export const salas = pgTable(
  "salas",
  {
    /** Identificador técnico aleatorio. No aparece en ninguna URL. */
    id: text("id").primaryKey(),

    /** Permite recuperar el código de la clase y crear o editar misiones. */
    codigoCreacion: text("codigo_creacion").notNull(),

    /** Abre la sala en modo solo juego. Nunca habilita editar ni borrar. */
    codigoJuego: text("codigo_juego").notNull(),

    /**
     * Los cuatro símbolos dibujados por la clase, en el formato acotado de
     * trazos de la aplicación. Nunca SVG ni HTML del usuario.
     */
    simbolos: jsonb("simbolos").notNull(),

    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
    ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true }).notNull().defaultNow(),

    /** La persistencia es temporal: pasada esta fecha la sala deja de existir. */
    caducaEn: timestamp("caduca_en", { withTimezone: true }).notNull(),
  },
  (tabla) => [
    uniqueIndex("salas_codigo_creacion_idx").on(tabla.codigoCreacion),
    uniqueIndex("salas_codigo_juego_idx").on(tabla.codigoJuego),
    index("salas_caduca_en_idx").on(tabla.caducaEn),
  ],
);

export const misiones = pgTable(
  "misiones",
  {
    id: text("id").primaryKey(),

    salaId: text("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),

    /** Número visible: "Misión 1", "Misión 2". No se piden nombres de autores. */
    numero: integer("numero").notNull(),

    /** Cuál de los cuatro escenarios se eligió. */
    escenarioId: integer("escenario_id").notNull(),

    /** Personalización visual. No altera las reglas de movimiento. */
    personaje: text("personaje").notNull(),
    objetoMeta: text("objeto_meta").notNull(),

    salidaFila: integer("salida_fila").notNull(),
    salidaColumna: integer("salida_columna").notNull(),
    orientacion: text("orientacion").notNull(),

    metaFila: integer("meta_fila").notNull(),
    metaColumna: integer("meta_columna").notNull(),

    /**
     * La secuencia con la que el grupo autor comprobó que la misión se resuelve.
     * Se guarda para validar que la misión es resoluble, no como respuesta
     * correcta: cualquier otra secuencia que llegue a la meta también vale, y
     * esta nunca se le muestra a quien juega.
     */
    secuenciaAutora: jsonb("secuencia_autora").notNull(),

    publicada: boolean("publicada").notNull().default(true),

    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [index("misiones_sala_id_idx").on(tabla.salaId)],
);

export type FilaSala = typeof salas.$inferSelect;
export type FilaMision = typeof misiones.$inferSelect;
