import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { students, movements, promoUsages, classrooms } from "@/lib/billetera/schema";
import { eq, and, sql } from "drizzle-orm";
import { parseQR, calcularPromoKey, grupoPromo } from "@/lib/billetera/qr";
import { calcularPago, leerOpciones } from "@/lib/billetera/payments";
import { sumarDiasHabiles } from "@/lib/billetera/fechas";
import type { QRData } from "@/types/billetera";

// Mes simulado vigente del aula, como subconsulta: el pago no suma un SELECT y el
// valor se lee en la misma sentencia que lo usa.
function periodoDelAula(classroomId: string) {
  return sql<number>`(select ${classrooms.periodo} from ${classrooms} where ${classrooms.id} = ${classroomId})`;
}

// Beneficio que el estudiante ya recibió con esta promo en el mes simulado. Se
// deriva de los movimientos (no hay contador aparte), así el "mes nuevo" de la
// docente solo tiene que avanzar el periodo del aula.
async function beneficioAcumulado(studentId: string, classroomId: string, qrData: QRData): Promise<number> {
  if (qrData.topePesos === undefined || qrData.tipo === "normal") return 0;
  const [fila] = await db
    .select({
      acumulado: sql<number>`coalesce(sum(${movements.descuento} + ${movements.reintegro}), 0)::int`,
    })
    .from(movements)
    .where(
      and(
        eq(movements.studentId, studentId),
        eq(movements.promocion, grupoPromo(qrData)),
        eq(movements.tipoMovimiento, "pago"),
        sql`${movements.periodo} = ${periodoDelAula(classroomId)}`
      )
    );
  return Number(fila?.acumulado ?? 0);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, qrText } = body;

  const [student] = await db.select().from(students).where(eq(students.id, studentId));
  if (!student) {
    return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 });
  }

  const parsed = parseQR(qrText);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const qrData = parsed.data;
  const promoKey = calcularPromoKey(qrData);

  const lectura = leerOpciones(qrData, body);
  if (!lectura.ok) {
    return NextResponse.json({ error: lectura.error }, { status: 400 });
  }

  if (qrData.tope !== undefined) {
    const [usage] = await db
      .select()
      .from(promoUsages)
      .where(and(eq(promoUsages.studentId, studentId), eq(promoUsages.promoKey, promoKey)));

    if (usage && usage.usesCount >= qrData.tope) {
      return NextResponse.json(
        { error: "Alcanzaste el límite de esta promoción.", limitReached: true, qrData },
        { status: 409 }
      );
    }
  }

  const acumulado = await beneficioAcumulado(studentId, student.classroomId, qrData);
  const result = calcularPago(qrData, student.balance, { ...lectura.opciones, acumulado });

  if (result.balanceAfter < 0) {
    return NextResponse.json(
      { error: "Saldo insuficiente. No te alcanza para esta compra. ¿Qué podés hacer? Hablalo con tu grupo." },
      { status: 400 }
    );
  }

  await db.update(students).set({ balance: result.balanceAfter }).where(eq(students.id, studentId));

  const [movement] = await db
    .insert(movements)
    .values({
      studentId,
      classroomId: student.classroomId,
      comercio: qrData.comercio,
      producto: qrData.producto,
      precioBase: result.precioBase,
      descuento: result.descuento,
      reintegro: result.reintegro,
      total: result.total,
      balanceAfter: result.balanceAfter,
      promoKey: qrData.tipo !== "normal" ? promoKey : null,
      cantidad: result.cantidad,
      promocion: qrData.tipo !== "normal" ? grupoPromo(qrData) : null,
      periodo: periodoDelAula(student.classroomId),
      diaCompra: lectura.opciones.dia ?? null,
      estadoReintegro: result.pendiente ? "pendiente" : null,
      acreditaEl:
        result.pendiente && qrData.plazo !== undefined ? sumarDiasHabiles(new Date(), qrData.plazo) : null,
    })
    .returning();

  if (qrData.tope !== undefined && qrData.tipo !== "normal") {
    const [existing] = await db
      .select()
      .from(promoUsages)
      .where(and(eq(promoUsages.studentId, studentId), eq(promoUsages.promoKey, promoKey)));

    if (existing) {
      await db
        .update(promoUsages)
        .set({ usesCount: existing.usesCount + 1 })
        .where(and(eq(promoUsages.studentId, studentId), eq(promoUsages.promoKey, promoKey)));
    } else {
      await db.insert(promoUsages).values({ studentId, promoKey, usesCount: 1 });
    }
  }

  return NextResponse.json({
    movement,
    newBalance: result.balanceAfter,
    pendiente: result.pendiente,
    reintegro: result.reintegro,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const studentId = searchParams.get("studentId");
  const qrText = searchParams.get("qrText");

  if (!studentId || !qrText) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }

  const [student] = await db.select().from(students).where(eq(students.id, studentId));
  if (!student) return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 });

  const parsed = parseQR(qrText);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const qrData = parsed.data;
  const promoKey = calcularPromoKey(qrData);
  let limitReached = false;
  let usosRestantes: number | undefined;

  if (qrData.tope !== undefined) {
    const [usage] = await db
      .select()
      .from(promoUsages)
      .where(and(eq(promoUsages.studentId, studentId), eq(promoUsages.promoKey, promoKey)));

    const usados = usage?.usesCount ?? 0;
    limitReached = usados >= qrData.tope;
    usosRestantes = Math.max(0, qrData.tope - usados);
  }

  // El modal recalcula en vivo con la cantidad, el monto y el día que elija el
  // estudiante; lo único que necesita del server es cuánto tope ya consumió.
  const acumulado = await beneficioAcumulado(studentId, student.classroomId, qrData);
  const result = calcularPago(qrData, student.balance, { acumulado });

  return NextResponse.json({
    qrData,
    result,
    currentBalance: student.balance,
    limitReached,
    usosRestantes,
    acumulado,
  });
}
