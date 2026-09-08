import { NextResponse } from 'next/server';
import { actualizarCurso, borrarCurso, obtenerCurso } from '@/lib/editor/cursos';

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Contexto) {
  const { id } = await params;
  const curso = await obtenerCurso(id);
  if (!curso) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(curso);
}

export async function PUT(req: Request, { params }: Contexto) {
  const { id } = await params;

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }

  const curso = await actualizarCurso(id, cuerpo);
  if (!curso) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(curso);
}

export async function DELETE(_: Request, { params }: Contexto) {
  const { id } = await params;
  const borrado = await borrarCurso(id);
  if (!borrado) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
