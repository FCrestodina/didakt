"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Download, Copy, Check, QrCode, BookOpen } from "lucide-react";
import { buildQRText, formDesdeQR, parseQR, type QRFormFields } from "@/lib/billetera/qr";
import { DIAS_SEMANA } from "@/lib/billetera/fechas";
import { descargarQR, nivelQR } from "@/lib/billetera/qr-imagen";
import type { DiaSemana } from "@/types/billetera";

type Tipo = QRFormFields["tipo"];
type Modo = QRFormFields["modo"];

const FORM_INICIAL: QRFormFields = {
  comercio: "Kiosco Escolar",
  producto: "Alfajor",
  precio: "2500",
  tipo: "normal",
  modo: "porcentaje",
  promo: "20",
  tope: "",
  precioLibre: false,
  lleva: "2",
  paga: "1",
  topePesos: "",
  minimo: "",
  dias: [],
  acreditacion: "instantanea",
  plazo: "3",
  promocion: "",
  modalidad: "",
  vigencia: "",
  condiciones: "",
};

const TIPOS: { valor: Tipo; etiqueta: string }[] = [
  { valor: "normal", etiqueta: "Normal" },
  { valor: "descuento", etiqueta: "Descuento" },
  { valor: "reintegro", etiqueta: "Reintegro" },
  { valor: "nxm", etiqueta: "Llevá N, pagá M" },
  { valor: "segunda", etiqueta: "% en la 2.ª unidad" },
];

// Las promos por unidad necesitan un precio por unidad: no van con monto libre.
const POR_UNIDAD: Tipo[] = ["nxm", "segunda"];

const INPUT =
  "w-full rounded-2xl border border-gray-200 bg-white py-2.5 pr-3.5 text-base outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

// useSearchParams pide un Suspense por encima para que la página se pueda prerenderizar.
export default function GenerarQRPage() {
  return (
    <Suspense fallback={null}>
      <Generador />
    </Suspense>
  );
}

function Generador() {
  const searchParams = useSearchParams();
  // ?qr=<texto del QR> precarga el formulario: así el kit de los casos abre cada QR
  // en el generador para cambiarle el precio o las condiciones.
  const [form, setForm] = useState<QRFormFields>(() => {
    const qr = searchParams.get("qr");
    const leido = qr ? parseQR(qr) : null;
    return leido?.ok ? { ...FORM_INICIAL, ...formDesdeQR(leido.data) } : FORM_INICIAL;
  });
  const [copied, setCopied] = useState(false);
  const canvasWrap = useRef<HTMLDivElement>(null);

  function set<K extends keyof QRFormFields>(campo: K, valor: QRFormFields[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function toggleDia(letra: DiaSemana) {
    setForm((f) => {
      const dias = f.dias ?? [];
      return { ...f, dias: dias.includes(letra) ? dias.filter((d) => d !== letra) : [...dias, letra] };
    });
  }

  const precioNum = parseInt(form.precio, 10);
  const precioValido = form.precioLibre || (!isNaN(precioNum) && precioNum > 0);
  const lleva = parseInt(form.lleva ?? "", 10);
  const paga = parseInt(form.paga ?? "", 10);
  const nxmValido = form.tipo !== "nxm" || (lleva >= 2 && paga >= 1 && paga < lleva);
  const valido = precioValido && nxmValido;

  const qrText = buildQRText(form);

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
              value={form.comercio}
              onChange={(e) => set("comercio", e.target.value)}
              className={`${INPUT} pl-3.5`}
              placeholder="Ej: Kiosco Escolar"
            />
          </Field>

          <Field label="Producto">
            <input
              value={form.producto}
              onChange={(e) => set("producto", e.target.value)}
              className={`${INPUT} pl-3.5`}
              placeholder="Ej: Alfajor"
            />
          </Field>

          <Field label="Precio">
            <Opciones
              valor={form.precioLibre ? "libre" : "fijo"}
              opciones={[
                { valor: "fijo", etiqueta: "Precio fijo" },
                { valor: "libre", etiqueta: "Monto libre" },
              ]}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  precioLibre: v === "libre",
                  tipo: v === "libre" && POR_UNIDAD.includes(f.tipo) ? "normal" : f.tipo,
                }))
              }
            />
            <div className="mt-2">
              {form.precioLibre ? (
                <Ayuda>El estudiante escribe el monto al pagar (por ejemplo, la compra del súper).</Ayuda>
              ) : (
                <Numero valor={form.precio} onChange={(v) => set("precio", v)} prefijo="$" placeholder="2500" />
              )}
            </div>
          </Field>

          <Field label="Tipo de operación">
            <Opciones
              valor={form.tipo}
              opciones={TIPOS.map((t) => ({
                ...t,
                deshabilitada: form.precioLibre && POR_UNIDAD.includes(t.valor),
              }))}
              onChange={(v) => set("tipo", v)}
            />
            {form.precioLibre && <Ayuda>Las promos por unidad necesitan un precio fijo.</Ayuda>}
          </Field>

          {(form.tipo === "descuento" || form.tipo === "reintegro") && (
            <>
              <Field label="Modo del beneficio">
                <Opciones
                  valor={form.modo}
                  opciones={[
                    { valor: "porcentaje" as Modo, etiqueta: "Porcentaje (%)" },
                    { valor: "monto" as Modo, etiqueta: "Monto fijo ($)" },
                  ]}
                  onChange={(v) => set("modo", v)}
                />
              </Field>

              <Field label={form.modo === "porcentaje" ? "Porcentaje del beneficio" : "Monto del beneficio"}>
                <Numero
                  valor={form.promo}
                  onChange={(v) => set("promo", v)}
                  prefijo={form.modo === "monto" ? "$" : undefined}
                  sufijo={form.modo === "porcentaje" ? "%" : undefined}
                  placeholder={form.modo === "porcentaje" ? "20" : "1000"}
                />
                {form.modo === "monto" && <Ayuda>Por cada unidad que se lleve.</Ayuda>}
              </Field>
            </>
          )}

          {form.tipo === "nxm" && (
            <Field label="Promo por cantidad">
              <div className="flex gap-2 mb-2">
                {[
                  ["2", "1"],
                  ["3", "2"],
                ].map(([l, p]) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, lleva: l, paga: p }))}
                    className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                  >
                    {l}x{p}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Llevá</span>
                  <Numero valor={form.lleva ?? ""} onChange={(v) => set("lleva", v)} placeholder="2" />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Pagá</span>
                  <Numero valor={form.paga ?? ""} onChange={(v) => set("paga", v)} placeholder="1" />
                </div>
              </div>
              {!nxmValido && (
                <p className="text-xs text-red-500 mt-1">
                  Tiene que llevar más unidades de las que paga (ej: llevá 3, pagá 2).
                </p>
              )}
            </Field>
          )}

          {form.tipo === "segunda" && (
            <Field label="Descuento en la 2.ª unidad">
              <Numero valor={form.promo} onChange={(v) => set("promo", v)} sufijo="%" placeholder="50" />
              <Ayuda>Se aplica a cada segunda unidad: con 4 unidades, a 2 de ellas.</Ayuda>
            </Field>
          )}

          {form.tipo === "reintegro" && (
            <Field label="¿Cuándo se acredita el reintegro?">
              <Opciones
                valor={form.acreditacion ?? "instantanea"}
                opciones={[
                  { valor: "instantanea" as const, etiqueta: "Al instante" },
                  { valor: "pendiente" as const, etiqueta: "Lo acredita la docente" },
                ]}
                onChange={(v) => set("acreditacion", v)}
              />
              {form.acreditacion === "pendiente" && (
                <div className="mt-2">
                  <span className="block text-xs text-gray-500 mb-1">
                    Días hábiles que muestra la app (vacío = sin fecha)
                  </span>
                  <Numero valor={form.plazo ?? ""} onChange={(v) => set("plazo", v)} placeholder="3" />
                  <Ayuda>Queda en «A acreditar» hasta que lo acredites desde el panel del aula.</Ayuda>
                </div>
              )}
            </Field>
          )}

          {form.tipo !== "normal" && (
            <fieldset className="rounded-2xl border border-gray-200 p-4 space-y-4">
              <legend className="px-1 text-sm font-semibold text-gray-700">Condiciones de la promo (opcionales)</legend>

              <Field label="Tope en pesos por mes">
                <Numero
                  valor={form.topePesos ?? ""}
                  onChange={(v) => set("topePesos", v)}
                  prefijo="$"
                  placeholder="Sin tope"
                />
                <Ayuda>
                  Lo máximo que devuelve o descuenta a cada estudiante. Vuelve a cero con «Empezar mes nuevo».
                </Ayuda>
              </Field>

              <Field label="Compra mínima">
                <Numero valor={form.minimo ?? ""} onChange={(v) => set("minimo", v)} prefijo="$" placeholder="Sin mínimo" />
              </Field>

              <Field label="Días que aplica">
                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA.map((d) => {
                    const marcado = form.dias?.includes(d.letra) ?? false;
                    return (
                      <button
                        key={d.letra}
                        type="button"
                        title={d.nombre}
                        aria-label={d.nombre}
                        aria-pressed={marcado}
                        onClick={() => toggleDia(d.letra)}
                        className={`rounded-xl py-2 text-sm font-bold transition-all ${
                          marcado ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {d.letra}
                      </button>
                    );
                  })}
                </div>
                <Ayuda>Ninguno marcado = todos los días. Si marcás alguno, el estudiante elige qué día compra.</Ayuda>
              </Field>

              <Field label="Nombre de la promoción">
                <input
                  value={form.promocion ?? ""}
                  onChange={(e) => set("promocion", e.target.value)}
                  className={`${INPUT} pl-3.5`}
                  placeholder="Ej: Transporte con QR"
                />
                <Ayuda>Los QR con el mismo nombre comparten el tope (por ejemplo, colectivo y subte).</Ayuda>
              </Field>
            </fieldset>
          )}

          <Field label="Tope de usos por estudiante (opcional)">
            <Numero valor={form.tope} onChange={(v) => set("tope", v)} placeholder="Sin límite" />
          </Field>

          <fieldset className="rounded-2xl border border-gray-200 p-4 space-y-4">
            <legend className="px-1 text-sm font-semibold text-gray-700">Datos que se muestran (no se controlan)</legend>
            <Field label="Modalidad">
              <input
                value={form.modalidad ?? ""}
                onChange={(e) => set("modalidad", e.target.value)}
                className={`${INPUT} pl-3.5`}
                placeholder="Ej: QR presencial"
              />
            </Field>
            <Field label="Vigencia">
              <input
                value={form.vigencia ?? ""}
                onChange={(e) => set("vigencia", e.target.value)}
                className={`${INPUT} pl-3.5`}
                placeholder="Ej: Hasta el 31/05/2026"
              />
            </Field>
            <Field label="Otras condiciones">
              <input
                value={form.condiciones ?? ""}
                onChange={(e) => set("condiciones", e.target.value)}
                className={`${INPUT} pl-3.5`}
                placeholder="Ej: Hasta agotar cupo"
              />
            </Field>
          </fieldset>
        </div>

        {/* Preview + QR */}
        <div className="space-y-4 sm:sticky sm:top-6 self-start">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
            {valido ? (
              <div ref={canvasWrap} className="bg-white p-3 rounded-2xl">
                <QRCodeCanvas value={qrText} size={220} level={nivelQR(qrText)} marginSize={4} />
              </div>
            ) : (
              <div className="w-[224px] h-[224px] rounded-2xl bg-gray-50 flex items-center justify-center text-center text-gray-400 text-sm px-6">
                {precioValido ? "Revisá la promo para generar el QR." : "Ingresá un precio válido para generar el QR."}
              </div>
            )}

            {valido && (
              <div className="text-center mt-3">
                {form.producto && <p className="font-bold text-gray-900">{form.producto}</p>}
                {form.comercio && <p className="text-xs text-gray-500">{form.comercio}</p>}
                {form.precioLibre && <p className="text-xs text-gray-500">Monto libre</p>}
              </div>
            )}

            <button
              onClick={() => descargarQR(canvasWrap.current, form.producto || form.comercio || "qr")}
              disabled={!valido}
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

          <Link
            href="/billetera-virtual/casos"
            className="flex items-center justify-center gap-2 rounded-2xl border border-green-300 py-3 text-sm text-green-700 font-semibold hover:bg-green-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> QR listos para los Casos 1, 2 y 3
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-10 border-t pt-6">
        El QR se genera dentro de la app, sin servicios externos. Imprimilo o proyectalo
        para tu «feria» de comercios.
      </p>
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

function Ayuda({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1">{children}</p>;
}

function Opciones<T extends string>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: { valor: T; etiqueta: string; deshabilitada?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          disabled={o.deshabilitada}
          onClick={() => onChange(o.valor)}
          className={`flex-1 min-w-[7rem] rounded-xl px-3 py-2 text-sm font-semibold transition-all disabled:opacity-40 ${
            valor === o.valor ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

function Numero({
  valor,
  onChange,
  prefijo,
  sufijo,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  prefijo?: string;
  sufijo?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      {prefijo && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{prefijo}</span>
      )}
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        inputMode="numeric"
        className={`${INPUT} ${prefijo ? "pl-7" : "pl-3.5"}`}
        placeholder={placeholder}
      />
      {sufijo && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{sufijo}</span>
      )}
    </div>
  );
}
