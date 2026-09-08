import Link from 'next/link';
import { ArrowRight, FileText, Layers } from 'lucide-react';
import { NIVELES, type SecuenciaAlojada } from '@/content/secuencias';

export function SecuenciaCard({ secuencia }: { secuencia: SecuenciaAlojada }) {
  const { acento } = secuencia;

  return (
    <Link
      href={`/secuencias/${secuencia.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-noche-2 transition-colors hover:border-white/20"
    >
      {/* Franja de acento: es lo único que distingue una secuencia de otra de un vistazo. */}
      <div className="h-1 w-full" style={{ backgroundColor: acento }} />

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${acento}1f`, color: acento }}
          >
            {NIVELES[secuencia.nivel]}
          </span>
          <span className="text-[11px] text-apagado">{secuencia.grados}</span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-white">{secuencia.titulo}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-tenue">{secuencia.bajada}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {secuencia.areas.map((area) => (
            <span
              key={area}
              className="rounded-md border border-white/8 px-2 py-0.5 text-[11px] text-apagado"
            >
              {area}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-4 pt-5 text-[12px] text-apagado">
          <span className="flex items-center gap-1.5">
            <Layers size={13} />
            {secuencia.recursos.length} recurso{secuencia.recursos.length !== 1 ? 's' : ''}
          </span>
          {secuencia.materiales.length > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText size={13} />
              Manual del docente
            </span>
          )}
          <ArrowRight
            size={16}
            className="ml-auto text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
          />
        </div>
      </div>
    </Link>
  );
}
