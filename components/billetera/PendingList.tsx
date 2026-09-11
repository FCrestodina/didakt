"use client";

import { Clock } from "lucide-react";
import type { Movement } from "@/types/billetera";
import { formatPesos } from "@/lib/billetera/format";
import { formatFechaCorta } from "@/lib/billetera/fechas";

// Pestaña "A acreditar": los reintegros que la promo devuelve más adelante y que
// todavía no entraron al saldo.
export function PendingList({ movements }: { movements: Movement[] }) {
  const pendientes = movements.filter((m) => m.estadoReintegro === "pendiente");

  if (pendientes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No tenés reintegros por acreditar.</p>
        <p className="text-xs mt-1">Cuando una promo te devuelve la plata más adelante, la ves acá hasta que llega.</p>
      </div>
    );
  }

  const total = pendientes.reduce((suma, m) => suma + m.reintegro, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5 text-center">
        <p className="text-sm text-amber-700">Te van a devolver</p>
        <p className="text-4xl font-black text-amber-800 tracking-tight">{formatPesos(total)}</p>
        <p className="text-xs text-amber-700 mt-2">Todavía no está en tu saldo: lo acredita tu docente.</p>
      </div>

      <ul className="space-y-3">
        {pendientes.map((m) => (
          <li key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {m.comercio} — {m.producto}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Compra del {formatFechaCorta(m.timestamp)}</p>
              </div>
              <span className="font-bold text-amber-700 text-sm shrink-0">+{formatPesos(m.reintegro)}</span>
            </div>
            <p className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
              {m.acreditaEl
                ? `Se acredita el ${formatFechaCorta(m.acreditaEl)}`
                : "Se acredita cuando lo libere tu docente"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
