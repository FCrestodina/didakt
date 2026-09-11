"use client";

import { useRef } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, BookOpen, Download, Pencil, Printer } from "lucide-react";
import { CASOS, type QRDelKit } from "@/lib/billetera/kit";
import { descargarQR, nivelQR } from "@/lib/billetera/qr-imagen";

// Kit de QR para los Casos 1, 2 y 3: listos para proyectar, imprimir (sale solo
// cada QR con su nombre) o descargar en PNG.
export default function CasosPage() {
  return (
    <main className="min-h-screen px-5 py-8 max-w-3xl mx-auto">
      <Link
        href="/billetera-virtual/ayuda"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la ayuda
      </Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500 shadow print:hidden">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">QR para los Casos 1, 2 y 3</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 print:hidden"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-10 print:hidden">
        Listos para proyectar o imprimir. Cada QR se puede descargar en PNG o cambiar con «Editar», que lo abre
        en el generador. Al imprimir (o guardar como PDF) salen solo los QR con su nombre.
      </p>

      {CASOS.map((caso) => (
        <section key={caso.id} className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{caso.titulo}</h2>
          <p className="text-sm text-gray-600 mb-4">{caso.consigna}</p>

          <ul className="mb-5 space-y-1.5 text-sm text-gray-700 print:hidden">
            {caso.notas.map((nota) => (
              <li key={nota} className="flex gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{nota}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
            {caso.qrs.map((q) => (
              <TarjetaQR key={q.id} qr={q} />
            ))}
          </div>

          <details className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 print:hidden">
            <summary className="cursor-pointer font-semibold text-gray-800">
              Respuestas esperadas (para la docente)
            </summary>
            <ul className="mt-2 space-y-1.5">
              {caso.respuestas.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
        </section>
      ))}
    </main>
  );
}

function TarjetaQR({ qr }: { qr: QRDelKit }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center break-inside-avoid">
      <div ref={ref} className="bg-white p-2 rounded-2xl">
        <QRCodeCanvas value={qr.texto} size={200} level={nivelQR(qr.texto)} marginSize={4} />
      </div>
      <p className="font-bold text-gray-900 mt-2">{qr.titulo}</p>
      <p className="text-xs text-gray-500 mt-0.5">{qr.detalle}</p>
      <div className="flex gap-2 mt-3 w-full print:hidden">
        <button
          onClick={() => descargarQR(ref.current, qr.id)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2 text-sm font-bold text-white hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4" /> PNG
        </button>
        <Link
          href={`/billetera-virtual/generar?qr=${encodeURIComponent(qr.texto)}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>
    </div>
  );
}
