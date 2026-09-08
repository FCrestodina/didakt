"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { AvatarPicker } from "@/components/billetera/AvatarPicker";
import { ToastContainer, useToast } from "@/components/billetera/Toast";

const rules = [
  { label: "Entre 6 y 8 caracteres", test: (p: string) => p.length >= 6 && p.length <= 8 },
  { label: "Una letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /[0-9]/.test(p) },
];

function EstudianteForm() {
  const router = useRouter();
  const { toasts, add, remove } = useToast();

  // El aula puede venir precargada por el QR del docente (?aula=...). Antes se
  // leia de window.location dentro de un useEffect y se volcaba con setState,
  // que es lo que prohibe react-hooks/set-state-in-effect. useSearchParams lo
  // da en el render, sin tocar window (funciona igual en el server), asi que
  // el codigo entra directo como valor inicial y codeFromQR se deriva.
  const aulaDelQR = useSearchParams().get("aula") ?? "";

  const [classroomCode, setClassroomCode] = useState(aulaDelQR);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState("astronauta");
  const [loading, setLoading] = useState(false);
  const codeFromQR = aulaDelQR !== "";

  const passwordOk = rules.every((r) => r.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classroomCode: classroomCode.trim(),
        username: username.trim(),
        password,
        avatar,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      add("error", data.error ?? "No se pudo entrar al aula.");
    } else {
      localStorage.setItem("studentId", data.id);
      localStorage.setItem("classroomCode", classroomCode.trim());
      router.push("/billetera-virtual/billetera");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-sm mx-auto">
      <Link
        href="/billetera-virtual"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-3 shadow">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Entrar al aula</h1>
        <p className="text-gray-500 text-sm mt-2">
          Si es tu primera vez, se crea tu perfil. Si ya entraste antes, usá tu mismo
          usuario y contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            Nombre del aula
            {codeFromQR && (
              <span className="text-xs font-semibold text-green-600">✓ cargado desde el QR</span>
            )}
          </label>
          <input
            type="text"
            value={classroomCode}
            onChange={(e) => setClassroomCode(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ej: 7° B"
            required
            autoFocus={!codeFromQR}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre de usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ej: dino_verde"
            maxLength={20}
            required
            autoComplete="off"
          />
          <p className="text-xs text-gray-400 mt-1">{username.length}/20 caracteres</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 8))}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="······"
              maxLength={8}
              required
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <ul className="mt-2 grid grid-cols-2 gap-1">
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <li
                  key={r.label}
                  className={`flex items-center gap-1 text-xs ${
                    password.length === 0 ? "text-gray-400" : ok ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Elegí tu avatar
          </label>
          <AvatarPicker selected={avatar} onSelect={setAvatar} />
          <p className="text-xs text-gray-400 mt-1.5">
            El avatar se usa solo cuando creás tu perfil por primera vez.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !classroomCode.trim() || !username.trim() || !passwordOk}
          className="w-full rounded-2xl bg-green-500 py-4 text-white font-bold text-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar al aula"}
        </button>
      </form>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </main>
  );
}

// useSearchParams obliga a un limite de Suspense: sin el, Next no puede
// prerenderizar la ruta y el build falla.
export default function EstudiantePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-gray-400">
          Cargando...
        </main>
      }
    >
      <EstudianteForm />
    </Suspense>
  );
}
