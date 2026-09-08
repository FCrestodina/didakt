import { LogoCrestech } from '@/components/marca/LogoCrestech';

export function SitioFooter() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <LogoCrestech size={22} />
          <span className="text-[12px] font-bold tracking-[0.2em] text-oro">CRESTECH</span>
        </div>
        <p className="text-sm text-apagado sm:ml-auto">
          Recursos educativos desarrollados por Crestech.
        </p>
      </div>
    </footer>
  );
}
