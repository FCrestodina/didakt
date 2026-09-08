"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LienzoSimbolo, SimboloSvg } from "@/components/stem/simbolos";
import { ACCIONES, ETIQUETA_ACCION, type Accion } from "@/lib/stem/grid/tipos";
import { dibujoVacio, type CodigoClase, type Dibujo } from "@/lib/stem/misiones/trazos";

/**
 * Módulo A · Crear el código de la clase.
 *
 * Se usa después de que los chicos inventaron los símbolos en papel, los
 * intercambiaron y la clase acordó un único código común. Esta pantalla no
 * reemplaza esa construcción: la digitaliza para poder reutilizarla.
 *
 * El sistema nunca dice que reconoció un dibujo. El símbolo queda asociado a una
 * acción porque fue dibujado dentro del casillero de esa acción.
 */

const AYUDAS: Record<Accion, string> = {
  AVANZAR: "Mueve un casillero hacia adelante.",
  GIRO_DERECHA_90: "Gira 90° a la derecha, sin cambiar de casillero.",
  GIRO_IZQUIERDA_90: "Gira 90° a la izquierda, sin cambiar de casillero.",
  DETENER: "Termina la secuencia donde está.",
};

function codigoVacio(): CodigoClase {
  return Object.fromEntries(ACCIONES.map((a) => [a, [] as Dibujo])) as CodigoClase;
}

export default function PaginaCodigoDeLaClase() {
  const router = useRouter();
  const [simbolos, setSimbolos] = useState<CodigoClase>(codigoVacio);
  const [etapa, setEtapa] = useState<"dibujo" | "revision">("dibujo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faltantes = ACCIONES.filter((accion) => dibujoVacio(simbolos[accion]));
  const completo = faltantes.length === 0;

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/salas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simbolos }),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => null);
        setError(cuerpo?.error ?? "No se pudo guardar el código. Probá de nuevo.");
        return;
      }
      const { codigoCreacion } = await respuesta.json();
      router.push(`/stem/misiones/sala/${codigoCreacion}?recienCreada=1`);
    } catch {
      setError("No se pudo conectar. Revisá la conexión y probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (etapa === "revision") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Este es el código de nuestra clase</h1>
        <p className="mt-1 text-gray-600">
          Cada símbolo quedó asociado a una acción por el casillero en el que se dibujó.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCIONES.map((accion) => (
            <li key={accion} className="rounded-xl border-2 border-gray-300 bg-white p-3">
              <SimboloSvg
                dibujo={simbolos[accion]}
                titulo={`Símbolo asociado a ${ETIQUETA_ACCION[accion]}`}
                className="aspect-square w-full rounded-lg border border-gray-200"
              />
              <p className="mt-2 text-center text-sm font-bold uppercase tracking-wide text-gray-900">
                {ETIQUETA_ACCION[accion]}
              </p>
              <p className="mt-1 text-center text-xs text-gray-600">
                Este símbolo quedó asociado a {ETIQUETA_ACCION[accion]}.
              </p>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEtapa("dibujo")}
            disabled={guardando}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Volver a editar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {guardando ? "Guardando…" : "Guardar el código de la clase"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">El código de nuestra clase</h1>
      <p className="mt-1 text-gray-600">
        Dibujen el símbolo que la clase eligió para esta acción.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCIONES.map((accion) => (
          <LienzoSimbolo
            key={accion}
            etiqueta={ETIQUETA_ACCION[accion]}
            ayuda={AYUDAS[accion]}
            dibujo={simbolos[accion]}
            onCambiar={(dibujo) => setSimbolos((previo) => ({ ...previo, [accion]: dibujo }))}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEtapa("revision")}
          disabled={!completo}
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Ver el código completo
        </button>

        {/* No se puede guardar con un casillero en blanco. */}
        {!completo && (
          <p className="text-sm text-gray-700">
            {faltantes.length === 1
              ? `Falta dibujar el símbolo de ${ETIQUETA_ACCION[faltantes[0]]}.`
              : `Faltan ${faltantes.length} símbolos por dibujar.`}
          </p>
        )}
      </div>
    </main>
  );
}
