"use client";

import { useState } from "react";

const TONOS = {
  azul: { boton: "bg-blue-600 hover:bg-blue-700", foco: "focus:ring-blue-500" },
  verde: { boton: "bg-emerald-600 hover:bg-emerald-700", foco: "focus:ring-emerald-500" },
} as const;

interface Props {
  // Qué va a pasar si confirma.
  children: React.ReactNode;
  confirmar: string;
  enviando: string;
  tono?: keyof typeof TONOS;
  onConfirm: (pin: string) => Promise<void>;
  onCancel: () => void;
}

// Confirmación de una acción del panel docente: explica qué va a pasar y pide el
// PIN de nuevo, igual que "Ajustar créditos" y "Cerrar aula" (el panel no lo guarda).
export function ConfirmarConPin({ children, confirmar, enviando, tono = "azul", onConfirm, onCancel }: Props) {
  const [pin, setPin] = useState("");
  const [cargando, setCargando] = useState(false);
  const t = TONOS[tono];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      await onConfirm(pin);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-white border border-gray-200 p-4 text-sm text-gray-700">{children}</div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN docente</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={`w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 ${t.foco}`}
          placeholder="······"
          required
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={cargando || !pin}
          className={`flex-1 rounded-2xl py-3 text-white font-bold active:scale-95 transition-all disabled:opacity-50 ${t.boton}`}
        >
          {cargando ? enviando : confirmar}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
