import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { obtenerDb } from '@/lib/editor/db';

export const dynamic = 'force-dynamic';

/**
 * Health check para el VPS (PM2, Nginx, monitoreo externo).
 *
 * Distingue tres estados a propósito, porque en este hub "sin base" no es lo
 * mismo que "base rota": el catálogo público, el Robot mensajero y Mundialito
 * andan sin Postgres. Sólo se devuelve 503 cuando la base **está configurada
 * pero no responde**, que es el único caso donde hay algo que arreglar.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, base: 'sin-configurar' });
  }

  try {
    await obtenerDb().execute(sql`select 1`);
    return NextResponse.json({ ok: true, base: 'ok' });
  } catch {
    // Sin detalle del error a propósito: es un endpoint público.
    return NextResponse.json({ ok: false, base: 'error' }, { status: 503 });
  }
}
