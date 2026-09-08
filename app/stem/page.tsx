import Link from "next/link";

/**
 * Portada. Las dos herramientas pertenecen a la misma secuencia STEM+ de Primer
 * Ciclo y comparten el mismo motor de movimiento: mismas cuatro acciones, misma
 * grilla, misma forma de calcular la derecha y la izquierda.
 */
export default function Inicio() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Secuencia STEM+ · Nivel Primario · Primer Ciclo
      </p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">Recursos de la secuencia</h1>
      <p className="mt-2 text-gray-600">
        Dos herramientas web para usar en el aula. No piden cuenta, no piden nombre y no guardan
        datos personales de los chicos.
      </p>

      <div className="mt-8 space-y-4">
        <Link
          href="/stem/robot"
          className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-600"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desafío 1</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Robot mensajero</h2>
          <p className="mt-1 text-gray-600">
            Simulador para probar indicaciones orales y observar qué información puede convertirse
            en una acción y cuál no.
          </p>
        </Link>

        <Link
          href="/stem/misiones"
          className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-600"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Desafíos 2, 3 y 4
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Creador de misiones</h2>
          <p className="mt-1 text-gray-600">
            La clase dibuja su propio código de símbolos, arma misiones de recorrido con él y las
            comparte en una sala para que otro grupo las resuelva.
          </p>
        </Link>
      </div>
    </main>
  );
}
