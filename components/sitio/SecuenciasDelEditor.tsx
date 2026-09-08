'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Course } from '@/types';

type CursoPublicado = Course & { _id: string };

/**
 * Secuencias armadas con el editor de bloques. Son las únicas entradas del
 * catálogo que dependen de la base de datos, así que se cargan del lado del
 * cliente y **fallan en silencio**: si la base no responde, el catálogo de
 * secuencias alojadas se sigue viendo igual. Sólo se listan las publicadas —
 * los borradores viven en el panel.
 */
export function SecuenciasDelEditor() {
  const [cursos, setCursos] = useState<CursoPublicado[]>([]);

  useEffect(() => {
    let vigente = true;
    fetch('/api/courses')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CursoPublicado[]) => {
        if (vigente && Array.isArray(data)) {
          setCursos(data.filter((c) => c.status === 'published'));
        }
      })
      .catch(() => {
        /* sin base de datos el catálogo estático alcanza */
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (cursos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16">
      <h2 className="text-xl font-semibold text-white">Secuencias de lectura</h2>
      <p className="mt-1.5 text-sm text-apagado">
        Armadas con el editor de bloques: texto, imágenes, videos y actividades de repaso.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cursos.map((curso) => {
          const acento = curso.theme?.primaryColor ?? '#d4af37';
          const lecciones = curso.lessons?.length ?? 0;
          return (
            <Link
              key={curso._id}
              href={`/courses/${curso._id}/preview`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-noche-2 transition-colors hover:border-white/20"
            >
              <div className="h-1 w-full" style={{ backgroundColor: acento }} />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-semibold leading-snug text-white">{curso.title}</h3>
                {curso.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-tenue">{curso.description}</p>
                )}
                <div className="mt-auto flex items-center gap-1.5 pt-5 text-[12px] text-apagado">
                  <BookOpen size={13} />
                  {lecciones} lección{lecciones !== 1 ? 'es' : ''}
                  <ArrowRight
                    size={16}
                    className="ml-auto text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
