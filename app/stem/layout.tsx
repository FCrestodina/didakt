import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Se conserva Inter y el fondo claro del repo original: las 7 capturas del
// manual del docente son de estas pantallas.
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Secuencia STEM+ · Primer Ciclo',
  description:
    'Robot mensajero y Creador de misiones: recursos de una secuencia STEM+ de Nivel Primario, Primer Ciclo — Buenos Aires Aprende',
};

export default function StemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} stem-tema min-h-screen bg-slate-50 text-[#171717]`}>
      {children}
    </div>
  );
}
