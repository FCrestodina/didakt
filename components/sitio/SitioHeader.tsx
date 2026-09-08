import Link from 'next/link';
import { LogoCrestech } from '@/components/marca/LogoCrestech';

export function SitioHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-noche/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoCrestech size={28} />
          <span className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-[0.2em] text-oro">CRESTECH</span>
            <span className="mt-1 text-[11px] tracking-[0.12em] text-apagado">DIDÁCTICO</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-6 text-sm">
          <Link href="/#secuencias" className="text-tenue transition-colors hover:text-white">
            Secuencias
          </Link>
          <a
            href="https://crestech.com.ar"
            target="_blank"
            rel="noreferrer"
            className="hidden text-tenue transition-colors hover:text-white sm:block"
          >
            Crestech
          </a>
        </nav>
      </div>
    </header>
  );
}
