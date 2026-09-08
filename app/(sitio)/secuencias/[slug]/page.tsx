import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { SECUENCIAS, NIVELES, buscarSecuencia } from '@/content/secuencias';

// En Next 16 los params de ruta son una Promise y hay que await-earlos en un
// server component (ver el header del CLAUDE.md del repo).
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SECUENCIAS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const secuencia = buscarSecuencia(slug);
  if (!secuencia) return {};
  return {
    title: secuencia.titulo,
    description: secuencia.bajada,
  };
}

export default async function SecuenciaPage({ params }: Props) {
  const { slug } = await params;
  const secuencia = buscarSecuencia(slug);
  if (!secuencia) notFound();

  const { acento } = secuencia;

  return (
    <article className="mx-auto max-w-3xl px-6 pt-12 pb-8">
      <Link
        href="/#secuencias"
        className="inline-flex items-center gap-1.5 text-sm text-apagado transition-colors hover:text-white"
      >
        <ArrowLeft size={15} />
        Todas las secuencias
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${acento}1f`, color: acento }}
          >
            {NIVELES[secuencia.nivel]}
          </span>
          {secuencia.ciclo && <span className="text-[12px] text-apagado">{secuencia.ciclo}</span>}
          <span className="text-[12px] text-apagado">· {secuencia.grados}</span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          {secuencia.titulo}
        </h1>
        <p className="mt-3 text-lg text-tenue">{secuencia.bajada}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {secuencia.areas.map((area) => (
            <span
              key={area}
              className="rounded-md border border-white/8 px-2 py-0.5 text-[11px] text-apagado"
            >
              {area}
            </span>
          ))}
          {secuencia.programa && (
            <span className="rounded-md border border-white/8 px-2 py-0.5 text-[11px] text-apagado">
              Programa {secuencia.programa}
            </span>
          )}
        </div>
      </header>

      <p className="mt-8 leading-relaxed text-tenue">{secuencia.descripcion}</p>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">
          {secuencia.recursos.length === 1 ? 'El recurso' : 'Los recursos'}
        </h2>

        <div className="mt-4 space-y-3">
          {secuencia.recursos.map((recurso) => (
            <div key={recurso.slug} className="rounded-2xl border border-white/8 bg-noche-2 p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-semibold text-white">{recurso.nombre}</h3>
                {recurso.momento && (
                  <span className="text-[12px]" style={{ color: acento }}>
                    {recurso.momento}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-tenue">{recurso.descripcion}</p>

              <Link
                href={recurso.ruta}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-noche transition-opacity hover:opacity-90"
                style={{ backgroundColor: acento }}
              >
                Abrir {recurso.nombre}
                <ArrowUpRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {secuencia.materiales.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Para el docente</h2>
          <div className="mt-4 space-y-3">
            {secuencia.materiales.map((material) => (
              <a
                key={material.archivo}
                href={material.archivo}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-noche-2 p-5 transition-colors hover:border-white/20"
              >
                <Download size={18} className="mt-0.5 shrink-0 text-oro" />
                <span>
                  <span className="block font-medium text-white">{material.nombre}</span>
                  <span className="mt-0.5 block text-sm text-apagado">{material.descripcion}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
