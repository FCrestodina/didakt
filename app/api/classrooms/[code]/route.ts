import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms, students, movements } from "@/lib/billetera/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const codeNorm = code.trim(); // Next ya decodifica el segmento de ruta.

  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.code, codeNorm), eq(classrooms.active, true)));

  if (!classroom) {
    return NextResponse.json(
      { error: "No encontramos esa aula. Verificá el código con tu docente." },
      { status: 404 }
    );
  }

  const studentList = await db
    .select()
    .from(students)
    .where(eq(students.classroomId, classroom.id))
    .orderBy(students.joinedAt);

  // Reintegros que esperan que la docente los acredite, por estudiante y promo.
  const pendientes = await db
    .select({
      studentId: movements.studentId,
      promocion: movements.promocion,
      total: sql<number>`sum(${movements.reintegro})::int`,
      compras: sql<number>`count(*)::int`,
    })
    .from(movements)
    .where(and(eq(movements.classroomId, classroom.id), eq(movements.estadoReintegro, "pendiente")))
    .groupBy(movements.studentId, movements.promocion);

  return NextResponse.json({ classroom, students: studentList, pendientes });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { pin } = await req.json();

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  await db
    .update(classrooms)
    .set({ active: false })
    .where(eq(classrooms.code, code.trim()));

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { pin, initialBalance, balanceAdjustment } = await req.json();

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  // Los dos campos son opcionales e independientes: se puede cambiar solo el crédito
  // inicial (afecta a quien entre después), solo los saldos actuales, o las dos cosas.
  const nuevoInicial = vacio(initialBalance) ? undefined : parseInt(initialBalance, 10);
  const ajuste = vacio(balanceAdjustment) ? undefined : parseInt(balanceAdjustment, 10);

  if (nuevoInicial === undefined && ajuste === undefined) {
    return NextResponse.json({ error: "No indicaste ningún cambio." }, { status: 400 });
  }
  if (nuevoInicial !== undefined && (isNaN(nuevoInicial) || nuevoInicial <= 0)) {
    return NextResponse.json({ error: "Crédito inicial inválido." }, { status: 400 });
  }
  if (ajuste !== undefined && (isNaN(ajuste) || ajuste === 0)) {
    return NextResponse.json(
      { error: "El ajuste de saldo tiene que ser un número distinto de cero." },
      { status: 400 }
    );
  }

  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.code, code.trim()), eq(classrooms.active, true)));

  if (!classroom) {
    return NextResponse.json(
      { error: "No encontramos esa aula. Verificá el código con tu docente." },
      { status: 404 }
    );
  }

  let actualizada = classroom;
  if (nuevoInicial !== undefined) {
    const [row] = await db
      .update(classrooms)
      .set({ initialBalance: nuevoInicial })
      .where(eq(classrooms.id, classroom.id))
      .returning();
    actualizada = row;
  }

  let studentsUpdated = 0;
  if (ajuste !== undefined) {
    // GREATEST mantiene el invariante de que ningún saldo queda negativo, igual que
    // el rechazo por saldo insuficiente de POST /api/payments.
    const filas = await db
      .update(students)
      .set({ balance: sql`GREATEST(${students.balance} + ${ajuste}, 0)` })
      .where(eq(students.classroomId, classroom.id))
      .returning();
    studentsUpdated = filas.length;
  }

  return NextResponse.json({ classroom: actualizada, studentsUpdated });
}

// Un campo ausente, null o string vacío significa "no lo toques".
function vacio(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}
