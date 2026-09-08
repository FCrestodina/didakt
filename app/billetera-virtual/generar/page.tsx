"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Download, Copy, Check, QrCode } from "lucide-react";
import { buildQRText } from "@/lib/billetera/qr";

type Tipo = "normal" | "descuento" | "reintegro";
type Modo = "porcentaje" | "monto";

export default function GenerarQRPage() {
  const [comercio, setComercio] = useState("Kiosco Escolar");
  const [producto, setProducto] = useState("Alfajor");
  const [precio, setPrecio] = useState("2500");
  const [tipo, setTipo] = useState<Tipo>("normal");
  const [modo, setModo] = useState<Modo>("porcentaje");
  const [promo, setPromo] = useState("20");
  const [tope, setTope] = useState("");
  const [copied, setCopied] = useState(false);

  const canvasWrap = useRef<HTMLDivElement>(null);

  const precioNum = parseInt(precio, 10);
  const precioValido = !isNaN(precioNum) && precioNum > 0;

  const qrText = buildQRText({ comercio, producto, precio, tipo, modo, promo, tope });

  function handleDownload() {
    const canvas = canvasWrap.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    const nombre = (producto || comercio || "qr").trim().replace(/[^\w\-]+/g, "_").toLowerCase();
    a.download = `qr-${nombre}.png`;
    a.href = url;
    a.click();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Algunos navegadores bloquean el portapapeles sin gesto; lo ignoramos.
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <Link
        href="/billetera-virtual/ayuda"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la ayuda
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500 shadow">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Generador de QR</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Completá los datos del producto o comercio y descargá el QR para imprimir o
        proyectar. Los estudiantes lo escanean desde su billetera.
      </p>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="space-y-4">
          <Field label="Comercio">
            <input
              value={comercio}
              onChange={(e) => setComercio(e.target.value)}
              className="input"
              placeholder="Ej: Kiosco Escolar"
            />
          </Field>

          <Field label="Producto">
            <input
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              className="input"
              placeholder="Ej: Alfajor"
            />
          </Field>

          <Field label="Precio (obligatorio)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="input pl-7"
                placeholder="2500"
              />
            </div>
          </Field>

          <Field label="Tipo de operación">
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "descuento", "reintegro"] as Tipo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`rounded-xl py-2 text-sm font-semibold capitalize transition-all ${
                    tipo === t
                      ? "bg-blue-600 text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {tipo !== "normal" && (
            <>
              <Field label="Modo del beneficio">
                <div className="grid grid-cols-2 gap-2">
                  {(["porcentaje", "monto"] as Modo[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModo(m)}
                      className={`rounded-xl py-2 text-sm font-semibold capitalize transition-all ${
                        modo === m
                          ? "bg-blue-600 text-white shadow"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {m === "porcentaje" ? "Porcentaje (%)" : "Monto fijo ($)"}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={modo === "porcentaje" ? "Porcentaje del beneficio" : "Monto del beneficio"}>
                <div className="relative">
                  {modo === "monto" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  )}
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    className={`input ${modo === "monto" ? "pl-7" : ""}`}
                    placeholder={modo === "porcentaje" ? "20" : "1000"}
                  />
                  {modo === "porcentaje" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                  )}
                </div>
              </Field>
            </>
          )}

          <Field label="Tope de usos por estudiante (opcional)">
            <input
              value={tope}
              onChange={(e) => setTope(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="input"
              placeholder="Sin límite"
            />
          </Field>
        </div>

        {/* Preview + QR */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
            {precioValido ? (
              <div ref={canvasWrap} className="bg-white p-3 rounded-2xl">
                <QRCodeCanvas value={qrText} size={220} level="H" marginSize={4} />
              </div>
            ) : (
              <div className="w-[224px] h-[224px] rounded-2xl bg-gray-50 flex items-center justify-center text-center text-gray-400 text-sm px-6">
                Ingresá un precio válido para generar el QR.
              </div>
            )}

            {precioValido && (
              <div className="text-center mt-3">
                {producto && <p className="font-bold text-gray-900">{producto}</p>}
                {comercio && <p className="text-xs text-gray-500">{comercio}</p>}
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={!precioValido}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-white font-bold hover:bg-green-600 active:scale-95 transition-all disabled:opacity-40"
            >
              <Download className="w-5 h-5" /> Descargar QR (PNG)
            </button>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">Texto del QR</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all">{qrText}</pre>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-10 border-t pt-6">
        El QR se genera dentro de la app, sin servicios externos. Imprimilo o proyectalo
        para tu «feria» de comercios.
      </p>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 0.6rem 0.9rem;
          font-size: 1rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #22c55e;
          border-color: transparent;
        }
        /* styled-jsx le gana en especificidad a la utilidad pl-7 de Tailwind:
           sin esta regla el valor queda tapado por el "$" de los campos con prefijo. */
        .input.pl-7 {
          padding-left: 1.75rem;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
