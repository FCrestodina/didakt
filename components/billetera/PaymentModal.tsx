"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ShoppingBag, Tag, RotateCcw } from "lucide-react";
import type { QRData } from "@/types/billetera";
import { formatPesos } from "@/lib/billetera/format";
import { calcularPago } from "@/lib/billetera/payments";

interface Props {
  qrData: QRData;
  currentBalance: number;
  limitReached?: boolean;
  usosRestantes?: number;
  onConfirm: () => void;
  onConfirmWithoutPromo?: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentModal({
  qrData,
  currentBalance,
  limitReached,
  usosRestantes,
  onConfirm,
  onConfirmWithoutPromo,
  onCancel,
  loading,
}: Props) {
  const result = calcularPago(qrData, currentBalance);
  const insufficient = result.balanceAfter < 0;

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
          className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-blue-600 px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-bold text-lg">{qrData.comercio}</span>
            </div>
            <p className="text-blue-100 text-sm">{qrData.producto}</p>
          </div>

          <div className="px-6 py-4 space-y-3">
            <Row label="Precio base" value={formatPesos(qrData.precio)} />

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
                  <span className="flex items-center gap-1 text-emerald-600">
                    <RotateCcw className="w-4 h-4" /> Reintegro
                  </span>
                }
                value={<span className="text-emerald-600 font-semibold">+{formatPesos(result.reintegro)}</span>}
              />
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

          <div className="px-6 pb-6 flex flex-col gap-2">
            {limitReached ? (
              <>
                {onConfirmWithoutPromo && (
                  <button
                    onClick={onConfirmWithoutPromo}
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Pagar sin promo ({formatPesos(qrData.precio)})
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
                  onClick={onConfirm}
                  disabled={loading || insufficient}
                  className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Procesando...</span>
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
