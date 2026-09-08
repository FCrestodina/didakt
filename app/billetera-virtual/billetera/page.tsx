"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QrCode, History, Wallet, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { Student, Movement, QRData } from "@/types/billetera";
import { formatPesos } from "@/lib/billetera/format";
import { getAvatar } from "@/components/billetera/avatars";
import { PaymentModal } from "@/components/billetera/PaymentModal";
import { TransactionList } from "@/components/billetera/TransactionList";
import { ToastContainer, useToast } from "@/components/billetera/Toast";

const QRScanner = dynamic(
  () => import("@/components/billetera/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

type Tab = "billetera" | "historial";

interface PaymentPreview {
  qrData: QRData;
  limitReached: boolean;
  usosRestantes?: number;
}

export default function BilleteraPage() {
  const router = useRouter();
  const { toasts, add, remove } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [tab, setTab] = useState<Tab>("billetera");
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [pendingQR, setPendingQR] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const studentId = typeof window !== "undefined" ? localStorage.getItem("studentId") : null;

  const fetchStudent = useCallback(async () => {
    if (!studentId) return;
    const res = await fetch(`/api/students?id=${studentId}`);
    if (res.ok) setStudent(await res.json());
  }, [studentId]);

  const fetchMovements = useCallback(async () => {
    if (!studentId) return;
    const res = await fetch(`/api/movements/${studentId}`);
    if (res.ok) setMovements(await res.json());
  }, [studentId]);

  // La carga va dentro de una IIFE async a proposito: llamar directo a
  // fetchStudent()/fetchMovements() desde el cuerpo del effect dispara
  // react-hooks/set-state-in-effect, que no distingue que el setState de esas
  // funciones ocurre despues del await. Promise.all mantiene los dos pedidos
  // en paralelo, como cuando se llamaban sueltos.
  useEffect(() => {
    if (!studentId) {
      router.replace("/billetera-virtual/estudiante");
      return;
    }
    void (async () => {
      await Promise.all([fetchStudent(), fetchMovements()]);
    })();
  }, [studentId, fetchStudent, fetchMovements, router]);

  async function handleQRScan(text: string) {
    setScanning(false);
    if (!studentId) return;

    const res = await fetch(
      `/api/payments?studentId=${studentId}&qrText=${encodeURIComponent(text)}`
    );
    const data = await res.json();

    if (!res.ok) {
      add("error", data.error ?? "QR no válido.");
      return;
    }

    setPendingQR(text);
    setPreview({
      qrData: data.qrData,
      limitReached: data.limitReached,
      usosRestantes: data.usosRestantes,
    });
  }

  async function processPayment(overrideQR?: string) {
    if (!studentId || !pendingQR) return;
    setLoadingPayment(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, qrText: overrideQR ?? pendingQR }),
    });

    const data = await res.json();
    if (!res.ok) {
      add("error", data.error ?? "Error al procesar el pago.");
    } else {
      add("success", `¡Pago realizado! Saldo: ${formatPesos(data.newBalance)}`);
      setPreview(null);
      setPendingQR(null);
      await Promise.all([fetchStudent(), fetchMovements()]);
    }
    setLoadingPayment(false);
  }

  async function handleConfirmWithoutPromo() {
    if (!preview || !studentId) return;
    const { qrData } = preview;
    const sinPromo = [
      `comercio=${qrData.comercio}`,
      `producto=${qrData.producto}`,
      `precio=${qrData.precio}`,
      `tipo=normal`,
    ].join("\n");
    setPreview(null);
    setPendingQR(sinPromo);
    await new Promise((r) => setTimeout(r, 0));
    await processPayment(sinPromo);
  }

  function handleCancel() {
    setPreview(null);
    setPendingQR(null);
  }

  function handleLogout() {
    localStorage.removeItem("studentId");
    localStorage.removeItem("classroomCode");
    router.push("/billetera-virtual");
  }

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando billetera...</div>
      </main>
    );
  }

  const av = getAvatar(student.avatar);

  return (
    <main className="min-h-screen max-w-sm mx-auto flex flex-col pb-6">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{av.emoji}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{student.username}</p>
            <p className="text-xs text-gray-400">Billetera virtual</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Salir"
          className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="flex border-b border-gray-200 px-5">
        {(["billetera", "historial"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors relative ${
              tab === t ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "billetera" ? "Billetera" : "Historial"}
            {tab === t && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5 py-6">
        <AnimatePresence mode="wait">
          {tab === "billetera" ? (
            <motion.div
              key="billetera"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="w-full bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white text-center shadow-xl">
                <div className="flex items-center justify-center gap-2 mb-2 text-blue-200">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Saldo disponible</span>
                </div>
                <motion.p
                  key={student.balance}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black tracking-tight"
                >
                  {formatPesos(student.balance)}
                </motion.p>
                <p className="text-blue-200 text-xs mt-3">* Simulación educativa · No es dinero real</p>
              </div>

              <button
                onClick={() => setScanning(true)}
                className="w-full flex items-center justify-center gap-3 rounded-3xl bg-green-500 py-6 text-white font-bold text-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                <QrCode className="w-8 h-8" />
                Pagar con QR
              </button>

              {movements.length > 0 && (
                <button
                  onClick={() => setTab("historial")}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <History className="w-4 h-4" />
                  Ver historial ({movements.length} movimiento{movements.length !== 1 ? "s" : ""})
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="historial"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <TransactionList movements={movements} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {scanning && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setScanning(false)}
        />
      )}

      {preview && (
        <PaymentModal
          qrData={preview.qrData}
          currentBalance={student.balance}
          limitReached={preview.limitReached}
          usosRestantes={preview.usosRestantes}
          onConfirm={() => processPayment()}
          onConfirmWithoutPromo={preview.limitReached ? handleConfirmWithoutPromo : undefined}
          onCancel={handleCancel}
          loading={loadingPayment}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </main>
  );
}
