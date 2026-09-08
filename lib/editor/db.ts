import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Conexión a Postgres del editor de bloques, creada la primera vez que se la
 * necesita.
 *
 * Lazy a propósito, igual que en STEM: el catálogo público no toca la base, así
 * que un build o una visita a `/` no pueden depender de que `DATABASE_URL` esté
 * definida. Es la misma razón por la que el cliente de Mongo se hizo lazy en su
 * momento (`37a819f`).
 */
let instancia: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function obtenerDb() {
  if (instancia) return instancia;

  const cadena = process.env.DATABASE_URL;
  if (!cadena) {
    throw new Error(
      'Falta DATABASE_URL. El editor de bloques necesita una base Postgres para guardar las secuencias.',
    );
  }

  const cliente = postgres(cadena, { prepare: false });
  instancia = drizzle(cliente, { schema });
  return instancia;
}
