import { NextResponse } from 'next/server';
import { crearCurso, listarCursos } from '@/lib/editor/cursos';

export async function GET() {
  const cursos = await listarCursos();
  return NextResponse.json(cursos);
}

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }

  const curso = await crearCurso(cuerpo);
  if (!curso) return NextResponse.json({ error: 'Falta el título.' }, { status: 400 });
  return NextResponse.json(curso, { status: 201 });
}
