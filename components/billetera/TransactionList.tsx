"use client";

import { formatPesos } from "@/lib/billetera/format";
import { DIAS_SEMANA } from "@/lib/billetera/fechas";
import type { Movement } from "@/types/billetera";
import { Tag, RotateCcw, ShoppingBag, Clock } from "lucide-react";

interface Props {
  movements: Movement[];
}

function fechaHora(ts: Movement["timestamp"]): string {
  return new Date(ts).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionList({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Todavía no hiciste ningún pago.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {movements.map((m) =>
        m.tipoMovimiento === "acreditacion" ? (
          <li key={m.id} className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-semibold text-emerald-800 text-sm">
                  <RotateCcw className="w-4 h-4" /> Reintegro acreditado
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {m.comercio} · {m.producto}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fechaHora(m.timestamp)}</p>
              </div>
              <span className="font-bold text-emerald-700 text-sm shrink-0">+{formatPesos(m.reintegro)}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between text-xs">
              <span className="text-gray-500">Saldo después</span>
              <span className="font-semibold text-gray-700">{formatPesos(m.balanceAfter)}</span>
            </div>
          </li>
        ) : (
          <li key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {m.comercio} — {m.producto}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fechaHora(m.timestamp)}</p>
              </div>
              <span className="font-bold text-gray-900 text-sm">{formatPesos(m.total)}</span>
            </div>

            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
              {m.cantidad > 1 ? (
                <p>
                  Precio: {m.cantidad} × {formatPesos(m.precioBase / m.cantidad)} = {formatPesos(m.precioBase)}
                </p>
              ) : m.precioBase !== m.total || m.descuento > 0 || m.reintegro > 0 ? (
                <p>Precio base: {formatPesos(m.precioBase)}</p>
              ) : null}

              {m.diaCompra && (
                <p>Compra del {DIAS_SEMANA.find((d) => d.letra === m.diaCompra)?.nombre ?? m.diaCompra}</p>
              )}

              {m.descuento > 0 && (
                <p className="flex items-center gap-1 text-green-600">
                  <Tag className="w-3 h-3" />
                  Descuento: -{formatPesos(m.descuento)}
                </p>
              )}

              {m.reintegro > 0 &&
                (m.estadoReintegro === "pendiente" ? (
                  <p className="flex items-center gap-1 text-amber-600">
                    <Clock className="w-3 h-3" />
                    Reintegro: +{formatPesos(m.reintegro)} · a acreditar
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-emerald-600">
                    <RotateCcw className="w-3 h-3" />
                    Reintegro: +{formatPesos(m.reintegro)}
                    {m.estadoReintegro === "acreditado" && " · acreditado"}
                  </p>
                ))}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-xs">
              <span className="text-gray-500">Saldo después</span>
              <span className="font-semibold text-gray-700">{formatPesos(m.balanceAfter)}</span>
            </div>
          </li>
        )
      )}
    </ul>
  );
}
