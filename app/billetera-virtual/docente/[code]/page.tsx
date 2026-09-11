"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, RefreshCw, Wallet, QrCode, Pencil, Archive, BookOpen, Clock, CalendarPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Student } from "@/types/billetera";
import { formatPesos } from "@/lib/billetera/format";
import { getAvatar } from "@/components/billetera/avatars";
import { ToastContainer, useToast } from "@/components/billetera/Toast";
import { ConfirmarConPin } from "@/components/billetera/ConfirmarConPin";

// Reintegros a acreditar de un estudiante en una promo (GET /api/classrooms/[code]).
interface Pendiente {
  studentId: string;
  promocion: string | null;
  total: number;
  compras: number;
}

interface ClassroomData {
  classroom: {
    id: string;
    code: string;
    initialBalance: number;
    active: boolean;
    periodo: number;
  };
  students: Student[];
  pendientes: Pendiente[];
}

// Acción del panel que está pidiendo el PIN. En "acreditar", promocion null = todas.
type Accion = null | { tipo: "acreditar"; promocion: string | null } | { tipo: "mes" };

// useParams() devuelve el segmento de ruta tal cual (url-encoded). Lo decodificamos
// una vez para tener el nombre real del aula y re-encodear sin duplicar.
function decodeParam(v?: string): string {
  if (!v) return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

// useSyncExternalStore pide un subscribe; aca el valor ("estamos en el cliente")
// nunca cambia despues de hidratar, asi que no hay a que suscribirse. Vive fuera
// del componente para que la referencia sea estable entre renders.
const subscribeNoop = () => () => {};

export default function DocentePanelPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeParam(params.code);
  const [data, setData] = useState<ClassroomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toasts, add, remove } = useToast();

  // joinUrl depende de window.location.origin, que no existe en el server.
  // Antes se resolvia con un useEffect + setState, que es exactamente lo que
  // prohibe react-hooks/set-state-in-effect. useSyncExternalStore es la forma
  // sancionada de leer un valor que difiere entre server y cliente: React usa
  // el snapshot del server durante la hidratacion y recien despues el del
  // cliente, asi que no hay mismatch. Ya no hace falta estado: joinUrl se
  // deriva en el render.
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const joinUrl =
    isClient && code
      ? `${window.location.origin}/billetera-virtual/estudiante?aula=${encodeURIComponent(code)}`
      : "";

  // Formulario de ajuste de créditos (el panel no guarda el PIN: lo pide de nuevo,
  // igual que el borrado de aula).
  const [editando, setEditando] = useState(false);
  const [pin, setPin] = useState("");
  const [nuevoInicial, setNuevoInicial] = useState("");
  const [ajuste, setAjuste] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cierre del aula: pide el PIN de nuevo porque es la acción que saca a los
  // estudiantes del aula.
  const [cerrando, setCerrando] = useState(false);
  const [pinCierre, setPinCierre] = useState("");
  const [enviandoCierre, setEnviandoCierre] = useState(false);

  const [accion, setAccion] = useState<Accion>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/classrooms/${encodeURIComponent(code)}`);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error);
      return;
    }
    const json = await res.json();
    setData(json);
    setLastUpdated(new Date());
  }, [code]);

  // Idem billetera: la primera carga va en una IIFE async porque llamar a
  // fetchData() suelto en el cuerpo del effect dispara set-state-in-effect.
  // Pasarla como callback a setInterval no lo dispara.
  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleAjuste(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    const body: Record<string, string> = { pin };
    if (nuevoInicial.trim()) body.initialBalance = nuevoInicial.trim();
    if (ajuste.trim()) body.balanceAdjustment = ajuste.trim();

    const res = await fetch(`/api/classrooms/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      add("error", json.error ?? "No se pudo guardar el cambio.");
    } else {
      add(
        "success",
        json.studentsUpdated > 0
          ? `Listo. Saldos actualizados: ${json.studentsUpdated}.`
          : "Crédito inicial actualizado."
      );
      setEditando(false);
      setPin("");
      setAjuste("");
      await fetchData();
    }
    setGuardando(false);
  }

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviandoCierre(true);

    const res = await fetch(`/api/classrooms/${encodeURIComponent(code)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinCierre }),
    });

    if (!res.ok) {
      const json = await res.json();
      add("error", json.error ?? "No se pudo cerrar el aula.");
      setEnviandoCierre(false);
      return;
    }
    // No se apaga `enviandoCierre`: la navegación desmonta la página.
    router.push("/billetera-virtual/docente");
  }

  async function acreditar(pinAccion: string, promocion: string | null) {
    const res = await fetch(`/api/classrooms/${encodeURIComponent(code)}/reintegros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinAccion, promocion }),
    });
    const json = await res.json();
    if (!res.ok) {
      add("error", json.error ?? "No se pudieron acreditar los reintegros.");
      return;
    }
    add(
      "success",
      json.compras === 0
        ? "No quedaban reintegros pendientes."
        : `Listo: ${formatPesos(json.total)} acreditados a ${json.estudiantes} estudiante${json.estudiantes !== 1 ? "s" : ""}.`
    );
    setAccion(null);
    await fetchData();
  }

  async function empezarMes(pinAccion: string) {
    const res = await fetch(`/api/classrooms/${encodeURIComponent(code)}/mes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinAccion }),
    });
    const json = await res.json();
    if (!res.ok) {
      add("error", json.error ?? "No se pudo empezar el mes nuevo.");
      return;
    }
    add("success", `Empezó el mes ${json.periodo}: los topes en pesos volvieron a cero.`);
    setAccion(null);
    await fetchData();
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <Link href="/billetera-virtual/docente" className="text-blue-600 underline">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Cargando aula...</p>
        </div>
      </main>
    );
  }

  const { classroom, students, pendientes } = data;

  // Pendientes agrupados por promo (para acreditar) y por estudiante (para la lista).
  const porPromo = new Map<string, { promocion: string | null; total: number; compras: number; estudiantes: Set<string> }>();
  const pendientePorEstudiante = new Map<string, number>();
  for (const p of pendientes) {
    const clave = p.promocion ?? "";
    const g = porPromo.get(clave) ?? { promocion: p.promocion, total: 0, compras: 0, estudiantes: new Set<string>() };
    g.total += p.total;
    g.compras += p.compras;
    g.estudiantes.add(p.studentId);
    porPromo.set(clave, g);
    pendientePorEstudiante.set(p.studentId, (pendientePorEstudiante.get(p.studentId) ?? 0) + p.total);
  }
  const gruposPendientes = [...porPromo.values()];
  const totalPendiente = gruposPendientes.reduce((suma, g) => suma + g.total, 0);
  const grupoElegido =
    accion?.tipo === "acreditar" && accion.promocion !== null ? porPromo.get(accion.promocion) : undefined;
  const aAcreditar = grupoElegido
    ? { total: grupoElegido.total, estudiantes: grupoElegido.estudiantes.size }
    : { total: totalPendiente, estudiantes: pendientePorEstudiante.size };

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <Link
        href="/billetera-virtual/docente"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6 shadow-lg">
        <p className="text-blue-200 text-sm mb-1">Nombre del aula</p>
        <p className="text-3xl sm:text-4xl font-black tracking-tight break-words">{classroom.code}</p>
        <p className="text-blue-200 text-sm mt-3">
          Crédito inicial: <strong className="text-white">{formatPesos(classroom.initialBalance)}</strong>
        </p>
        <p className="text-blue-200 text-sm">
          Mes simulado: <strong className="text-white">{classroom.periodo}</strong>
        </p>
        <button
          onClick={() => {
            setNuevoInicial(String(classroom.initialBalance));
            setAjuste("");
            setEditando(!editando);
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 active:scale-95 transition-all"
        >
          <Pencil className="w-4 h-4" /> Ajustar créditos
        </button>
      </div>

      {editando && (
        <form
          onSubmit={handleAjuste}
          className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN docente</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="······"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Crédito inicial
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <input
                type="number"
                value={nuevoInicial}
                onChange={(e) => setNuevoInicial(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Con el que arrancan los estudiantes que se sumen a partir de ahora.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sumar a los saldos actuales
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <input
                type="number"
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Le suma ese monto a los {students.length} estudiante{students.length !== 1 ? "s" : ""} que ya
              están en el aula. Vacío = no toca los saldos. Con un número negativo, resta (nunca baja de $0).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando || !pin || (!nuevoInicial.trim() && !ajuste.trim())}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-gray-700 mb-3">
          <QrCode className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-sm">Escaneá para unirte al aula</span>
        </div>
        {joinUrl ? (
          <div className="bg-white p-3 rounded-2xl border border-gray-100">
            <QRCodeSVG value={joinUrl} size={180} level="M" marginSize={0} />
          </div>
        ) : (
          <div className="w-[180px] h-[180px] bg-gray-50 rounded-2xl animate-pulse" />
        )}
        <p className="text-xs text-gray-400 mt-3">
          Apuntá la cámara o ingresá el aula <strong className="text-gray-600">{classroom.code}</strong> en{" "}
          <span className="font-mono">Soy estudiante</span>.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <Link
          href="/billetera-virtual/generar"
          className="flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-white font-bold hover:bg-green-600 active:scale-95 transition-all"
        >
          <QrCode className="w-5 h-5" /> Generar QR de productos
        </Link>
        <Link
          href="/billetera-virtual/casos"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-green-500 py-3 text-green-700 font-bold hover:bg-green-50 active:scale-95 transition-all"
        >
          <BookOpen className="w-5 h-5" /> QR de los Casos 1, 2 y 3
        </Link>
      </div>

      {gruposPendientes.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-2 text-amber-900 mb-1">
            <Clock className="w-5 h-5" />
            <h2 className="font-bold">Reintegros a acreditar</h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            {formatPesos(totalPendiente)} de {pendientePorEstudiante.size} estudiante
            {pendientePorEstudiante.size !== 1 ? "s" : ""}. Se suman a los saldos cuando los acreditás.
          </p>
          <ul className="space-y-2">
            {gruposPendientes.map((g) => (
              <li key={g.promocion ?? ""} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{g.promocion ?? "Reintegros"}</p>
                  <p className="text-xs text-gray-500">
                    {g.estudiantes.size} estudiante{g.estudiantes.size !== 1 ? "s" : ""} · {g.compras} compra
                    {g.compras !== 1 ? "s" : ""} · {formatPesos(g.total)}
                  </p>
                </div>
                <button
                  onClick={() => setAccion({ tipo: "acreditar", promocion: g.promocion })}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  Acreditar
                </button>
              </li>
            ))}
          </ul>
          {gruposPendientes.length > 1 && (
            <button
              onClick={() => setAccion({ tipo: "acreditar", promocion: null })}
              className="mt-3 w-full rounded-xl border border-emerald-300 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Acreditar todos
            </button>
          )}
          {accion?.tipo === "acreditar" && (
            <div className="mt-4">
              <ConfirmarConPin
                key={accion.promocion ?? "todos"}
                confirmar="Sí, acreditar"
                enviando="Acreditando..."
                tono="verde"
                onConfirm={(p) => acreditar(p, accion.promocion)}
                onCancel={() => setAccion(null)}
              >
                Se suman {formatPesos(aAcreditar.total)} a los saldos de {aAcreditar.estudiantes} estudiante
                {aAcreditar.estudiantes !== 1 ? "s" : ""}
                {accion.promocion !== null ? ` por «${accion.promocion}»` : ""}. Cada uno lo ve en su historial
                como reintegro acreditado.
              </ConfirmarConPin>
            </div>
          )}
        </section>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Users className="w-5 h-5" />
          <span className="font-semibold">{students.length} estudiante{students.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {lastUpdated
            ? `Actualizado ${lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Conectando..."}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Esperando que los estudiantes se unan...</p>
          <p className="text-xs mt-1">Compartí el aula <strong className="text-gray-600">{classroom.code}</strong> o el QR de arriba</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {students.map((s) => {
            const av = getAvatar(s.avatar);
            const pct = (s.balance / classroom.initialBalance) * 100;
            return (
              <li key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{av.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.username}</p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{formatPesos(s.balance)}</p>
                    <div className="flex items-center gap-1 justify-end text-xs text-gray-400 mt-0.5">
                      <Wallet className="w-3 h-3" />
                      <span>{Math.round(pct)}%</span>
                    </div>
                    {pendientePorEstudiante.has(s.id) && (
                      <p className="text-xs text-amber-600 font-semibold mt-0.5">
                        +{formatPesos(pendientePorEstudiante.get(s.id)!)} a acreditar
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 pt-6 border-t border-gray-100 space-y-3">
        {accion?.tipo === "mes" ? (
          <ConfirmarConPin
            confirmar="Sí, empezar mes nuevo"
            enviando="Guardando..."
            onConfirm={empezarMes}
            onCancel={() => setAccion(null)}
          >
            <p className="font-semibold mb-1">¿Empezar el mes {classroom.periodo + 1}?</p>
            <p>
              Los topes en pesos de las promos (por ejemplo, los $8.000 del transporte) vuelven a cero para
              todos. Los saldos, el historial y los reintegros pendientes no cambian.
            </p>
          </ConfirmarConPin>
        ) : (
          <button
            onClick={() => setAccion({ tipo: "mes" })}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Empezar mes nuevo
          </button>
        )}

        {cerrando ? (
          <form onSubmit={handleCerrar} className="space-y-4">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">¿Cerrar el aula {classroom.code}?</p>
              <p className="text-amber-800">
                {students.length === 0
                  ? "Todavía no entró ningún estudiante. "
                  : students.length === 1
                    ? "El estudiante que está en el aula deja de poder entrar. "
                    : `Los ${students.length} estudiantes dejan de poder entrar. `}
                Los saldos y el historial quedan guardados, y el nombre del aula se libera para volver a
                usarlo. No se puede reabrir desde la app.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN docente</label>
              <input
                type="password"
                value={pinCierre}
                onChange={(e) => setPinCierre(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="······"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={enviandoCierre || !pinCierre}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-white font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {enviandoCierre ? "Cerrando..." : "Sí, cerrar el aula"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCerrando(false);
                  setPinCierre("");
                }}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setCerrando(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 text-red-600 font-semibold hover:bg-red-50 transition-colors"
          >
            <Archive className="w-4 h-4" /> Cerrar aula
          </button>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </main>
  );
}
