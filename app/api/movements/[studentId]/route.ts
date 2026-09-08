import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { movements } from "@/lib/billetera/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  const list = await db
    .select()
    .from(movements)
    .where(eq(movements.studentId, studentId))
    .orderBy(desc(movements.timestamp));

  return NextResponse.json(list);
}
