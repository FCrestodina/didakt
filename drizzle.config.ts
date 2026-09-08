import type { Config } from 'drizzle-kit';

// Cada secuencia alojada trae su propio esquema. Van juntos en la misma base:
// sus tablas no se pisan (classrooms/students/movements/promo_usages contra
// salas/misiones), así que no hace falta prefijarlas.
export default {
  schema: ['./lib/billetera/schema.ts', './lib/stem/schema.ts', './lib/editor/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
