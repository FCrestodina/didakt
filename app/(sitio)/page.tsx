import { SECUENCIAS } from '@/content/secuencias';
import { SecuenciaCard } from '@/components/sitio/SecuenciaCard';
import { SecuenciasDelEditor } from '@/components/sitio/SecuenciasDelEditor';

export default function CatalogoPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-4 sm:pt-28">
        <p className="text-[12px] font-medium tracking-[0.18em] text-oro">CRESTECH DIDÁCTICO</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Las secuencias didácticas que hacemos, <span className="texto-oro">en un solo lugar</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-tenue sm:text-lg">
          Recursos web para usar en clase: se entra con un link, no hay que instalar nada y ningún
          chico necesita una cuenta. Cada secuencia trae su manual del docente.
        </p>
        <div className="linea-oro mt-12" />
      </section>

      <section id="secuencias" className="mx-auto max-w-6xl px-6 pt-12">
        <h2 className="text-xl font-semibold text-white">Secuencias</h2>
        <p className="mt-1.5 text-sm text-apagado">
          {SECUENCIAS.length} secuencia{SECUENCIAS.length !== 1 ? 's' : ''} · desarrolladas a medida
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECUENCIAS.map((secuencia) => (
            <SecuenciaCard key={secuencia.slug} secuencia={secuencia} />
          ))}
        </div>
      </section>

      <SecuenciasDelEditor />
    </>
  );
}
