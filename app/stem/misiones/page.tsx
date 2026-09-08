"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Play } from "lucide-react";
import {
  LARGO_CODIGO_CREACION,
  LARGO_CODIGO_JUEGO,
  esCodigoValido,
  normalizarCodigo,
} from "@/lib/stem/misiones/codigos";

/**
 * Portada del Creador de misiones.
 *
 * Los dos accesos de la sección 2.1 del manual están separados desde el
 * principio: el código de creación abre el trabajo del grupo autor y el código
 * de juego abre la sala en modo solo juego.
 */
export default function PortadaMisiones() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Secuencia STEM+ · Primer Ciclo
      </p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Creador de misiones</h1>
      <p className="mt-2 text-gray-600">
        Primero la clase dibuja su código de símbolos. Después, cada grupo lo usa para armar
        misiones y compartirlas.
      </p>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Pencil aria-hidden className="h-5 w-5 text-blue-700" />
          Empezar el código de nuestra clase
        </h2>
        <p className="mt-1 text-gray-600">
          Para hacer una sola vez, cuando la clase ya acordó los cuatro símbolos en papel.
        </p>
        <Link
          href="/stem/misiones/codigo"
          className="mt-3 inline-block rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700"
        >
          Dibujar los símbolos
        </Link>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <FormularioCodigo
          titulo="Seguir en nuestra sala"
          descripcion="Con el código de creación se recupera el código de la clase y se arman misiones nuevas."
          etiqueta="Código de creación"
          largo={LARGO_CODIGO_CREACION}
          destino={(codigo) => `/misiones/sala/${codigo}`}
          textoBoton="Entrar a crear"
        />

        <FormularioCodigo
          titulo="Jugar las misiones"
          descripcion="Con el código de juego se abre la sala de misiones. Este acceso no permite editar."
          etiqueta="Código de juego"
          largo={LARGO_CODIGO_JUEGO}
          destino={(codigo) => `/misiones/jugar/${codigo}`}
          textoBoton="Entrar a jugar"
          icono={<Play aria-hidden className="h-5 w-5 text-green-700" />}
        />
      </div>
    </main>
  );
}

function FormularioCodigo({
  titulo,
  descripcion,
  etiqueta,
  largo,
  destino,
  textoBoton,
  icono,
}: {
  titulo: string;
  descripcion: string;
  etiqueta: string;
  largo: number;
  destino: (codigo: string) => string;
  textoBoton: string;
  icono?: React.ReactNode;
}) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = `codigo-${largo}`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        {icono}
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{descripcion}</p>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const codigo = normalizarCodigo(valor);
          if (!esCodigoValido(codigo, largo)) {
            setError(`El ${etiqueta.toLowerCase()} tiene ${largo} caracteres.`);
            return;
          }
          setError(null);
          router.push(destino(codigo));
        }}
      >
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {etiqueta}
        </label>
        <input
          id={id}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 font-mono text-lg tracking-widest uppercase"
          placeholder={"•".repeat(largo)}
        />
        {error && (
          <p role="alert" className="mt-1 text-sm text-amber-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-3 text-base font-semibold text-white hover:bg-gray-800"
        >
          {textoBoton}
        </button>
      </form>
    </section>
  );
}
