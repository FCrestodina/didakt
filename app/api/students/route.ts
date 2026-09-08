import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/billetera/db";
import { classrooms, students } from "@/lib/billetera/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/billetera/auth";
import { validatePassword } from "@/lib/billetera/password";

// Estudiante sin el hash de la contraseña, para devolver al cliente.
function publicStudent(s: typeof students.$inferSelect) {
  const { passwordHash: _omit, ...rest } = s;
  void _omit;
  return rest;
}

export async function POST(req: NextRequest) {
  const { classroomCode, username, password, avatar } = await req.json();

  const code = String(classroomCode ?? "").trim();
  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.code, code), eq(classrooms.active, true)));

  if (!classroom) {
    return NextResponse.json(
      { error: "No encontramos esa aula. Verificá el nombre con tu docente." },
      { status: 404 }
    );
  }

  const user = String(username ?? "").trim().slice(0, 20);
  if (!user) {
    return NextResponse.json({ error: "El nombre de usuario no puede estar vacío." }, { status: 400 });
  }

  const pass = String(password ?? "");

  // ¿Ya existe ese usuario en esta aula?
  const [existing] = await db
    .select()
    .from(students)
    .where(and(eq(students.classroomId, classroom.id), eq(students.username, user)));

  if (existing) {
    // Login: validar contraseña contra el perfil existente.
    if (!verifyPassword(pass, existing.passwordHash)) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    return NextResponse.json(publicStudent(existing), { status: 200 });
  }

  // Primera vez: crear el perfil. La contraseña debe cumplir las reglas.
  const pwError = validatePassword(pass);
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }

  try {
    const [student] = await db
      .insert(students)
      .values({
        classroomId: classroom.id,
        username: user,
        passwordHash: hashPassword(pass),
        avatar: String(avatar ?? "astronauta"),
        balance: classroom.initialBalance,
      })
      .returning();

    return NextResponse.json(publicStudent(student), { status: 201 });
  } catch {
    // Carrera: el usuario se creó entre el SELECT y el INSERT. Lo tratamos como login.
    const [created] = await db
      .select()
      .from(students)
      .where(and(eq(students.classroomId, classroom.id), eq(students.username, user)));
    if (created && verifyPassword(pass, created.passwordHash)) {
      return NextResponse.json(publicStudent(created), { status: 200 });
    }
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("id");
  if (!studentId) return NextResponse.json({ error: "Falta el ID." }, { status: 400 });

  const [student] = await db.select().from(students).where(eq(students.id, studentId));
  if (!student) return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 });

  return NextResponse.json(publicStudent(student));
}
