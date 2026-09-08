import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Conexión a Postgres, creada la primera vez que se la necesita.
 *
 * El Robot mensajero no toca la base, y las páginas estáticas tampoco: si se
 * conectara al importar el módulo, un build o una visita a /robot fallarían sin
 * DATABASE_URL configurada.
 */

let instancia: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function obtenerDb() {
  if (instancia) return instancia;

  const cadena = process.env.DATABASE_URL;
  if (!cadena) {
    throw new Error(
      "Falta DATABASE_URL. El Creador de misiones necesita una base Postgres para guardar las salas.",
    );
  }

  const cliente = postgres(cadena, { prepare: false });
  instancia = drizzle(cliente, { schema });
  return instancia;
}

export function hayBaseConfigurada(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
