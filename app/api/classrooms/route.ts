import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms, students } from "@/lib/billetera/schema";
import { eq, desc, sql } from "drizzle-orm";

// Aulas abiertas, para que la docente vuelva a entrar a una que creó otro día.
// El PIN va en un header y no en la URL, que queda en logs e historial.
export async function GET(req: NextRequest) {
  if (req.headers.get("x-teacher-pin") !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  // Join y no subconsulta correlacionada: en un select de una sola tabla drizzle
  // escribe las columnas sin calificar, y dentro de la subconsulta "id" pasaba a
  // ser students.id — la cuenta daba siempre 0.
  const lista = await db
    .select({
      id: classrooms.id,
      code: classrooms.code,
      initialBalance: classrooms.initialBalance,
      createdAt: classrooms.createdAt,
      estudiantes: sql<number>`count(${students.id})::int`,
    })
    .from(classrooms)
    .leftJoin(students, eq(students.classroomId, classrooms.id))
    .where(eq(classrooms.active, true))
    .groupBy(classrooms.id)
    .orderBy(desc(classrooms.createdAt));

  return NextResponse.json(lista);
}

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
