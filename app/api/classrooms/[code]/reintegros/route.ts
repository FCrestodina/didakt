import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms, students, movements } from "@/lib/billetera/schema";
import { and, eq, sql } from "drizzle-orm";

// La docente acredita los reintegros pendientes del aula: todos, o solo los de una
// promo. En la vida real llegan solos a los N días hábiles; acá los libera ella
// cuando vuelve a tener clase, para que se vea el antes y el después del saldo.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { pin, promocion } = await req.json();

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
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

  const soloPromo = typeof promocion === "string" && promocion ? eq(movements.promocion, promocion) : undefined;

  const resumen = await db.transaction(async (tx) => {
    // Marcar y leer en la misma sentencia: si la docente toca dos veces, el segundo
    // UPDATE ya no encuentra filas pendientes y nadie cobra el reintegro doble.
    const filas = await tx
      .update(movements)
      .set({ estadoReintegro: "acreditado", acreditadoAt: new Date() })
      .where(
        and(eq(movements.classroomId, classroom.id), eq(movements.estadoReintegro, "pendiente"), soloPromo)
      )
      .returning();

    // Un solo movimiento de acreditación por estudiante y promo, con el total.
    const grupos = new Map<string, { studentId: string; promocion: string | null; total: number; compras: number }>();
    for (const f of filas) {
      const clave = `${f.studentId}|${f.promocion ?? ""}`;
      const g = grupos.get(clave) ?? { studentId: f.studentId, promocion: f.promocion, total: 0, compras: 0 };
      g.total += f.reintegro;
      g.compras += 1;
      grupos.set(clave, g);
    }

    for (const g of grupos.values()) {
      const [s] = await tx
        .update(students)
        .set({ balance: sql`${students.balance} + ${g.total}` })
        .where(eq(students.id, g.studentId))
        .returning({ balance: students.balance });

      await tx.insert(movements).values({
        studentId: g.studentId,
        classroomId: classroom.id,
        comercio: g.promocion ?? "Reintegro",
        producto: g.compras === 1 ? "Reintegro de 1 compra" : `Reintegro de ${g.compras} compras`,
        precioBase: 0,
        reintegro: g.total,
        total: 0,
        balanceAfter: s.balance,
        tipoMovimiento: "acreditacion",
        promocion: g.promocion,
        periodo: classroom.periodo,
      });
    }

    return {
      compras: filas.length,
      estudiantes: new Set(filas.map((f) => f.studentId)).size,
      total: filas.reduce((suma, f) => suma + f.reintegro, 0),
    };
  });

  return NextResponse.json(resumen);
}
