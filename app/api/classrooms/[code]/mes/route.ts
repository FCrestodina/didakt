import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms } from "@/lib/billetera/schema";
import { and, eq, sql } from "drizzle-orm";

// "Empezar mes nuevo": avanza el mes simulado del aula. Los topes en pesos se
// cuentan por periodo, así que vuelven a cero sin tocar ningún saldo ni movimiento.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { pin } = await req.json();

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  const [aula] = await db
    .update(classrooms)
    .set({ periodo: sql`${classrooms.periodo} + 1` })
    .where(and(eq(classrooms.code, code.trim()), eq(classrooms.active, true)))
    .returning();

  if (!aula) {
    return NextResponse.json(
      { error: "No encontramos esa aula. Verificá el código con tu docente." },
      { status: 404 }
    );
  }

  return NextResponse.json({ periodo: aula.periodo });
}
