import { SitioHeader } from '@/components/sitio/SitioHeader';
import { SitioFooter } from '@/components/sitio/SitioFooter';

/**
 * Shell del catálogo público. Va aparte del layout raíz porque el editor y el
 * panel siguen siendo claros: acá la marca es Crestech (negro y dorado) y ahí
 * es una herramienta de trabajo.
 */
export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-noche text-white">
      <SitioHeader />
      <main className="flex-1">{children}</main>
      <SitioFooter />
    </div>
  );
}
