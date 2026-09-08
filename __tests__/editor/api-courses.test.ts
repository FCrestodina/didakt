import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cursos from '@/lib/editor/cursos';
import { GET as listar, POST } from '@/app/api/courses/route';
import { GET as leer, PUT, DELETE } from '@/app/api/courses/[id]/route';

vi.mock('@/lib/editor/cursos', () => ({
  listarCursos: vi.fn(),
  obtenerCurso: vi.fn(),
  crearCurso: vi.fn(),
  actualizarCurso: vi.fn(),
  borrarCurso: vi.fn(),
}));

const URL_BASE = 'http://localhost/api/courses';
const ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

function pedido(cuerpo: unknown, metodo = 'POST') {
  // GET y HEAD no pueden llevar cuerpo: `new Request` tira TypeError.
  if (cuerpo === null) return new Request(URL_BASE, { method: metodo });
  return new Request(URL_BASE, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

const contexto = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /api/courses', () => {
  it('devuelve la lista', async () => {
    vi.mocked(cursos.listarCursos).mockResolvedValue([{ id: ID, title: 'Uno' }] as never);
    const res = await listar();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: ID, title: 'Uno' }]);
  });
});

describe('POST /api/courses', () => {
  it('crea y devuelve 201', async () => {
    vi.mocked(cursos.crearCurso).mockResolvedValue({ id: ID, title: 'Nueva' } as never);
    const res = await POST(pedido({ title: 'Nueva' }));
    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe(ID);
  });

  it('rechaza con 400 si falta el título', async () => {
    vi.mocked(cursos.crearCurso).mockResolvedValue(null);
    const res = await POST(pedido({ description: 'sin titulo' }));
    expect(res.status).toBe(400);
  });

  it('rechaza con 400 un cuerpo que no es JSON', async () => {
    const req = new Request(URL_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'esto no es json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(cursos.crearCurso).not.toHaveBeenCalled();
  });
});

describe('GET /api/courses/[id]', () => {
  it('devuelve el curso', async () => {
    vi.mocked(cursos.obtenerCurso).mockResolvedValue({ id: ID, title: 'Uno' } as never);
    const res = await leer(pedido(null, 'GET'), contexto(ID));
    expect(res.status).toBe(200);
  });

  // Antes un id malformado llegaba a la base y salía como 500.
  it('devuelve 404 y no 500 con un id que no existe o es inválido', async () => {
    vi.mocked(cursos.obtenerCurso).mockResolvedValue(null);
    const res = await leer(pedido(null, 'GET'), contexto('507f1f77bcf86cd799439011'));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/courses/[id]', () => {
  it('actualiza y devuelve el curso', async () => {
    vi.mocked(cursos.actualizarCurso).mockResolvedValue({ id: ID, title: 'Editada' } as never);
    const res = await PUT(pedido({ title: 'Editada' }, 'PUT'), contexto(ID));
    expect(res.status).toBe(200);
    expect(cursos.actualizarCurso).toHaveBeenCalledWith(ID, { title: 'Editada' });
  });

  it('devuelve 404 si el curso no existe', async () => {
    vi.mocked(cursos.actualizarCurso).mockResolvedValue(null);
    const res = await PUT(pedido({ title: 'X' }, 'PUT'), contexto(ID));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/courses/[id]', () => {
  it('borra y confirma', async () => {
    vi.mocked(cursos.borrarCurso).mockResolvedValue(true);
    const res = await DELETE(pedido(null, 'DELETE'), contexto(ID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  // Antes el DELETE devolvía { ok: true } aunque no hubiera borrado nada.
  it('devuelve 404 si no había nada que borrar', async () => {
    vi.mocked(cursos.borrarCurso).mockResolvedValue(false);
    const res = await DELETE(pedido(null, 'DELETE'), contexto(ID));
    expect(res.status).toBe(404);
  });
});
