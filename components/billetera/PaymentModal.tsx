"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ShoppingBag, Tag, RotateCcw, Clock, Minus, Plus } from "lucide-react";
import type { DiaSemana, QRData } from "@/types/billetera";
import { formatPesos } from "@/lib/billetera/format";
import { calcularPago, CANTIDAD_MAXIMA, type OpcionesPago } from "@/lib/billetera/payments";
import { DIAS_SEMANA, formatFechaCorta, listaDias, sumarDiasHabiles } from "@/lib/billetera/fechas";

interface Props {
  qrData: QRData;
  currentBalance: number;
  // Beneficio ya usado en el mes con esta promo (lo trae el preview del server).
  acumulado?: number;
  limitReached?: boolean;
  usosRestantes?: number;
  onConfirm: (opciones: OpcionesPago) => void;
  onConfirmWithoutPromo?: (opciones: OpcionesPago) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentModal({
  qrData,
  currentBalance,
  acumulado = 0,
  limitReached,
  usosRestantes,
  onConfirm,
  onConfirmWithoutPromo,
  onCancel,
  loading,
}: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [monto, setMonto] = useState("");
  const [dia, setDia] = useState<DiaSemana | undefined>();
  // La fecha se fija al abrir el modal (un initializer, no un Date en cada render).
  const [ahora] = useState(() => new Date());

  // Lo que elige el estudiante; el server lo vuelve a validar y recalcula todo.
  const opciones: OpcionesPago = qrData.precioLibre
    ? { monto: parseInt(monto, 10) || 0, dia }
    : { cantidad, dia };
  const result = calcularPago(qrData, currentBalance, { ...opciones, acumulado });
  const faltaMonto = !!qrData.precioLibre && !opciones.monto;
  const faltaDia = !!qrData.dias && !dia;
  const insufficient = !faltaMonto && result.balanceAfter < 0;
  const unitario = qrData.precioLibre ? result.precioBase : qrData.precio;
  const llegaEl =
    result.pendiente && qrData.plazo !== undefined
      ? formatFechaCorta(sumarDiasHabiles(ahora, qrData.plazo))
      : null;
  const condiciones = listarCondiciones(qrData, acumulado);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm max-h-[92vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-blue-600 px-6 py-5 text-white shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-bold text-lg">{qrData.comercio}</span>
            </div>
            <p className="text-blue-100 text-sm">{qrData.producto}</p>
          </div>

          <div className="px-6 py-4 space-y-3 overflow-y-auto">
            {condiciones.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {condiciones.map((c) => (
                  <li key={c} className="rounded-full bg-blue-50 text-blue-700 text-xs px-2.5 py-1">
                    {c}
                  </li>
                ))}
              </ul>
            )}

            {qrData.precioLibre ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Cuánto es la compra?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                  <input
                    value={monto}
                    onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
                    inputMode="numeric"
                    placeholder="0"
                    autoFocus
                    className="w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    disabled={cantidad <= 1}
                    aria-label="Una unidad menos"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-gray-900">{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(CANTIDAD_MAXIMA, c + 1))}
                    disabled={cantidad >= CANTIDAD_MAXIMA}
                    aria-label="Una unidad más"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {qrData.dias && (
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1.5">¿Qué día hacés la compra?</span>
                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA.map((d) => {
                    const aplica = qrData.dias!.includes(d.letra);
                    const elegido = dia === d.letra;
                    return (
                      <button
                        key={d.letra}
                        type="button"
                        title={d.nombre}
                        aria-label={d.nombre}
                        aria-pressed={elegido}
                        onClick={() => setDia(d.letra)}
                        className={`rounded-xl py-2 text-sm font-bold transition-all ${
                          elegido
                            ? "bg-blue-600 text-white shadow"
                            : aplica
                              ? "bg-green-50 text-green-700 ring-1 ring-green-300"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {d.letra}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Row
              label={
                !qrData.precioLibre && result.cantidad > 1
                  ? `Precio (${result.cantidad} × ${formatPesos(unitario)})`
                  : "Precio base"
              }
              value={formatPesos(result.precioBase)}
            />

            {result.descuento > 0 && (
              <Row
                label={
                  <span className="flex items-center gap-1 text-green-600">
                    <Tag className="w-4 h-4" /> Descuento
                  </span>
                }
                value={<span className="text-green-600 font-semibold">-{formatPesos(result.descuento)}</span>}
              />
            )}

            {result.reintegro > 0 && (
              <Row
                label={
                  <span
                    className={`flex items-center gap-1 ${result.pendiente ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {result.pendiente ? <Clock className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                    {result.pendiente ? "Reintegro a acreditar" : "Reintegro"}
                  </span>
                }
                value={
                  <span className={`font-semibold ${result.pendiente ? "text-amber-600" : "text-emerald-600"}`}>
                    +{formatPesos(result.reintegro)}
                  </span>
                }
              />
            )}

            {result.pendiente && (
              <p className="text-xs text-amber-700">
                {llegaEl
                  ? `Llega el ${llegaEl}. No se suma a tu saldo ahora.`
                  : "Lo acredita tu docente más adelante. No se suma a tu saldo ahora."}
              </p>
            )}

            {/* Sin monto escrito todavía, "no llega al mínimo" sería ruido. */}
            {result.motivoSinBeneficio && !limitReached && !faltaMonto && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                La promo no se aplica: {result.motivoSinBeneficio}
              </div>
            )}

            <div className="border-t pt-3">
              <Row
                label={<span className="font-bold text-gray-900">Total a pagar</span>}
                value={<span className="font-bold text-xl text-gray-900">{formatPesos(result.total)}</span>}
              />
            </div>

            <div className={`rounded-2xl p-3 ${insufficient ? "bg-red-50" : "bg-blue-50"}`}>
              <Row
                label="Tu saldo actual"
                value={<span className="font-semibold">{formatPesos(currentBalance)}</span>}
              />
              <Row
                label="Saldo después"
                value={
                  <span className={`font-bold text-lg ${insufficient ? "text-red-600" : "text-green-600"}`}>
                    {formatPesos(result.balanceAfter)}
                  </span>
                }
              />
              {result.pendiente && (
                <Row
                  label="Cuando llegue el reintegro"
                  value={<span className="font-semibold">{formatPesos(result.balanceAfter + result.reintegro)}</span>}
                />
              )}
            </div>

            {qrData.tope !== undefined && !limitReached && usosRestantes !== undefined && (
              <p className="text-xs text-gray-500 text-center">
                Podés usar esta promo {usosRestantes} {usosRestantes === 1 ? "vez" : "veces"} más.
              </p>
            )}

            {limitReached && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-amber-700 font-semibold text-sm">
                  Alcanzaste el límite de esta promoción.
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Podés pagar sin la promo o cancelar.
                </p>
              </div>
            )}

            {insufficient && (
              <p className="text-red-600 text-sm text-center font-medium">
                Saldo insuficiente. No te alcanza para esta compra. ¿Qué podés hacer? Hablalo con tu grupo.
              </p>
            )}
          </div>

          <div className="px-6 pb-6 pt-2 flex flex-col gap-2 shrink-0">
            {limitReached ? (
              <>
                {onConfirmWithoutPromo && (
                  <button
                    onClick={() => onConfirmWithoutPromo(opciones)}
                    disabled={loading || faltaMonto}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Pagar sin promo ({formatPesos(result.precioBase)})
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="w-full rounded-2xl bg-gray-100 px-6 py-4 text-gray-700 font-semibold hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onConfirm(opciones)}
                  disabled={loading || insufficient || faltaMonto || faltaDia}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Procesando...</span>
                  ) : faltaMonto ? (
                    <span>Escribí el monto</span>
                  ) : faltaDia ? (
                    <span>Elegí el día</span>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar pago
                    </>
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gray-100 px-6 py-4 text-gray-700 font-semibold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Las condiciones de la promo, como las muestran las apps reales al pagar.
function listarCondiciones(q: QRData, acumulado: number): string[] {
  const c: string[] = [];
  if (q.tipo === "descuento" || q.tipo === "reintegro") {
    if (q.promo > 0) {
      c.push(`${q.modo === "porcentaje" ? `${q.promo} %` : formatPesos(q.promo)} de ${q.tipo}`);
    }
  } else if (q.tipo === "nxm") {
    c.push(`Llevá ${q.lleva}, pagá ${q.paga}`);
  } else if (q.tipo === "segunda") {
    c.push(`${q.promo} % en la 2.ª unidad`);
  }
  if (q.minimo !== undefined) c.push(`Compra mínima ${formatPesos(q.minimo)}`);
  if (q.dias) c.push(`Solo ${listaDias(q.dias)}`);
  if (q.topePesos !== undefined) {
    c.push(
      `Tope ${formatPesos(q.topePesos)} por mes · te quedan ${formatPesos(Math.max(0, q.topePesos - acumulado))}`
    );
  }
  if (q.acreditacion === "pendiente") {
    c.push(
      q.plazo !== undefined
        ? `Se acredita a los ${q.plazo} ${q.plazo === 1 ? "día hábil" : "días hábiles"}`
        : "El reintegro lo acredita tu docente"
    );
  }
  if (q.modalidad) c.push(q.modalidad);
  if (q.vigencia) c.push(`Vigencia: ${q.vigencia}`);
  if (q.condiciones) c.push(q.condiciones);
  return c;
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-700">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
