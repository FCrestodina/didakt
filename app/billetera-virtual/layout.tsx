import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// La app venía de su propio repo con Inter en el body y `color-scheme: light`
// forzado. Se conserva tal cual: las 10 capturas del manual del docente son de
// esta pantalla, y cambiarle la tipografía las dejaría desactualizadas.
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Billetera Virtual Educativa',
  description:
    'Simulador educativo de billetera virtual para 6.º y 7.º grado — Buenos Aires Aprende',
};

export default function BilleteraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} billetera-tema min-h-screen bg-slate-50 text-[#171717]`}>
      {children}
    </div>
  );
}
