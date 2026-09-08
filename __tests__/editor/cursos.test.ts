import { describe, it, expect } from 'vitest';
import { camposEditables, esIdValido, TEMA_POR_DEFECTO } from '@/lib/editor/cursos';

describe('camposEditables', () => {
  it('deja pasar los campos que el editor puede cambiar', () => {
    const campos = camposEditables({
      title: 'Fracciones',
      description: 'Una intro',
      coverImage: 'https://ejemplo/tapa.png',
      status: 'published',
      lessons: [{ id: 'a', title: 'Intro', blocks: [] }],
      theme: { primaryColor: '#10b981', fontFamily: 'Inter' },
    });

    expect(campos).toEqual({
      title: 'Fracciones',
      description: 'Una intro',
      coverImage: 'https://ejemplo/tapa.png',
      status: 'published',
      lessons: [{ id: 'a', title: 'Intro', blocks: [] }],
      theme: { primaryColor: '#10b981', fontFamily: 'Inter' },
    });
  });

  // El editor manda el curso ENTERO en cada PUT. Con Mongoose el esquema
  // descartaba estas claves; Drizzle no filtra nada, así que si esto se rompe,
  // un PUT podría reescribir la clave primaria o falsear la fecha de creación.
  it('descarta el id y los timestamps que manda el editor', () => {
    const campos = camposEditables({
      id: '00000000-0000-0000-0000-000000000000',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
      title: 'Fracciones',
    });

    expect(campos).toEqual({ title: 'Fracciones' });
  });

  it('descarta claves desconocidas', () => {
    expect(camposEditables({ title: 'X', esAdmin: true, __proto__: {} })).toEqual({ title: 'X' });
  });

  it('ignora un status que no es del enum', () => {
    expect(camposEditables({ title: 'X', status: 'archivado' })).toEqual({ title: 'X' });
  });

  it('ignora lessons si no es un array', () => {
    expect(camposEditables({ title: 'X', lessons: 'ninguna' })).toEqual({ title: 'X' });
  });

  it('completa el tema con los valores por defecto si viene incompleto', () => {
    const campos = camposEditables({ theme: { primaryColor: '#ef4444' } });
    expect(campos.theme).toEqual({
      primaryColor: '#ef4444',
      fontFamily: TEMA_POR_DEFECTO.fontFamily,
    });
  });

  it('devuelve vacío si el cuerpo no es un objeto', () => {
    expect(camposEditables(null)).toEqual({});
    expect(camposEditables('hola')).toEqual({});
    expect(camposEditables(undefined)).toEqual({});
  });

  it('permite vaciar la descripción con string vacío', () => {
    expect(camposEditables({ description: '' })).toEqual({ description: '' });
  });
});

describe('esIdValido', () => {
  it('acepta un UUID', () => {
    expect(esIdValido('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(true);
  });

  // Los ids viejos de Mongo son 24 hex. Si alguno quedó en un favorito o en un
  // link viejo, tiene que dar 404 y no un 500 de Postgres por tipo inválido.
  it('rechaza un ObjectId de Mongo', () => {
    expect(esIdValido('507f1f77bcf86cd799439011')).toBe(false);
  });

  it('rechaza basura y cadenas vacías', () => {
    expect(esIdValido('')).toBe(false);
    expect(esIdValido('../../etc/passwd')).toBe(false);
    expect(esIdValido("1 OR 1=1")).toBe(false);
  });
});
