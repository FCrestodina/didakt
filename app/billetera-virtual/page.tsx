import Link from "next/link";
import { GraduationCap, Users, HelpCircle, Wallet } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Billetera Virtual
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Simulador educativo · Buenos Aires Aprende
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/billetera-virtual/docente"
            className="flex items-center gap-4 w-full rounded-3xl bg-blue-600 p-5 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="font-bold text-xl">Soy docente</p>
              <p className="text-blue-200 text-sm">Crear y gestionar aula</p>
            </div>
          </Link>

          <Link
            href="/billetera-virtual/estudiante"
            className="flex items-center gap-4 w-full rounded-3xl bg-green-500 p-5 text-white shadow-md hover:bg-green-600 active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20">
              <Users className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="font-bold text-xl">Soy estudiante</p>
              <p className="text-green-100 text-sm">Unirse al aula</p>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/billetera-virtual/ayuda"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Ayuda para docentes
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          Esta es una simulación educativa. No es dinero real.
        </p>
      </div>
    </main>
  );
}
