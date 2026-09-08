import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { students, movements, promoUsages } from "@/lib/billetera/schema";
import { eq, and } from "drizzle-orm";
import { parseQR, calcularPromoKey } from "@/lib/billetera/qr";
import { calcularPago } from "@/lib/billetera/payments";

export async function POST(req: NextRequest) {
  const { studentId, qrText } = await req.json();

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

  const result = calcularPago(qrData, student.balance);

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

  return NextResponse.json({ movement, newBalance: result.balanceAfter });
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

  const result = calcularPago(qrData, student.balance);

  return NextResponse.json({
    qrData,
    result,
    currentBalance: student.balance,
    limitReached,
    usosRestantes,
  });
}
