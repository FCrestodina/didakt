"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ToastContainer, useToast } from "@/components/billetera/Toast";

type Step = "pin" | "create";

export default function DocentePage() {
  const router = useRouter();
  const { toasts, add, remove } = useToast();

  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [code, setCode] = useState("");
  const [balance, setBalance] = useState("10000");
  const [loading, setLoading] = useState(false);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    if (pin === process.env.NEXT_PUBLIC_TEACHER_PIN_HINT) {
      setStep("create");
    } else {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, code: "TEST", initialBalance: 1 }),
      });
      if (res.status !== 401) {
        setStep("create");
      } else {
        add("error", "PIN incorrecto.");
      }
    }
    setLoading(false);
  }

  async function handleCreateClassroom(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, code, initialBalance: parseInt(balance, 10) }),
    });

    const data = await res.json();
    if (!res.ok) {
      add("error", data.error ?? "Error al crear el aula.");
    } else {
      router.push(`/billetera-virtual/docente/${encodeURIComponent(data.code)}`);
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/billetera-virtual"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-3 shadow">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "pin" ? "Acceso docente" : "Crear aula"}
          </h1>
        </div>

        {step === "pin" ? (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PIN docente
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="······"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full rounded-2xl bg-blue-600 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateClassroom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre del aula
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 7° B, Feria 2025"
                required
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                Nombre libre. Los estudiantes lo usan para entrar (ej: 7° B, Feria 2025).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Crédito inicial por estudiante
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code || !balance}
              className="w-full rounded-2xl bg-blue-600 py-4 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear aula"}
            </button>
          </form>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </main>
  );
}
