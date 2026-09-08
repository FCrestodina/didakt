import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms } from "@/lib/billetera/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { pin, code, initialBalance } = await req.json();

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  const codeNorm = String(code ?? "").trim();
  if (!codeNorm) {
    return NextResponse.json({ error: "El nombre del aula no puede estar vacío." }, { status: 400 });
  }

  const balance = parseInt(initialBalance, 10);
  if (isNaN(balance) || balance <= 0) {
    return NextResponse.json({ error: "Crédito inicial inválido." }, { status: 400 });
  }

  const existing = await db.select().from(classrooms).where(eq(classrooms.code, codeNorm));
  if (existing.length > 0) {
    if (existing[0].active) {
      return NextResponse.json({ error: "Ya existe un aula activa con ese código." }, { status: 409 });
    }
    // El aula cerrada libera el código renombrándose, no borrándose: `students` y
    // `movements` la referencian sin ON DELETE CASCADE, así que un DELETE explota por
    // FK apenas el aula haya tenido un estudiante. Renombrar también conserva el
    // historial de la cursada anterior en vez de tirarlo.
    const archivado = `${codeNorm} (cerrada ${new Date().toISOString().slice(0, 10)} · ${existing[0].id})`;
    await db.update(classrooms).set({ code: archivado }).where(eq(classrooms.id, existing[0].id));
  }

  const [classroom] = await db
    .insert(classrooms)
    .values({ code: codeNorm, initialBalance: balance })
    .returning();

  return NextResponse.json(classroom, { status: 201 });
}
