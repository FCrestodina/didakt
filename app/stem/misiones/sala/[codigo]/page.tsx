"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Trash2 } from "lucide-react";
import { SimboloSvg } from "@/components/stem/simbolos";
import { ACCIONES, ETIQUETA_ACCION } from "@/lib/stem/grid/tipos";
import { formatearCodigo } from "@/lib/stem/misiones/codigos";
import { escenarioPorId } from "@/lib/stem/misiones/tableros";
import { nombreObjetoMeta, nombrePersonaje } from "@/lib/stem/misiones/catalogo";
import type { CodigoClase } from "@/lib/stem/misiones/trazos";

/**
 * La sala en modo creación.
 *
 * Muestra el código de la clase, los dos accesos y las misiones ya guardadas.
 * Es la pantalla que usan el docente y los grupos durante la producción.
 */

interface MisionDeAutor {
  id: string;
  numero: number;
  escenarioId: number;
  personaje: string;
  objetoMeta: string;
  accionesDeLaSolucion: number;
}

interface SalaCreacion {
  codigoCreacion: string;
  codigoJuego: string;
  simbolos: CodigoClase;
  caducaEn: string;
  misiones: MisionDeAutor[];
}

export default function PaginaSala({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const router = useRouter();

  const [sala, setSala] = useState<SalaCreacion | null>(null);
  const [estado, setEstado] = useState<"cargando" | "lista" | "noExiste" | "error">("cargando");
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  /**
   * Trae la sala sin tocar el estado de React: así el efecto y el refresco
   * manual comparten la misma lógica y ninguno modifica estado de forma
   * síncrona dentro del cuerpo del efecto.
   */
  const traerSala = useCallback(async (): Promise<{
    estado: "lista" | "noExiste" | "error";
    sala: SalaCreacion | null;
  }> => {
    try {
      const respuesta = await fetch(`/api/salas/creacion/${codigo}`);
      if (respuesta.status === 404) return { estado: "noExiste", sala: null };
      if (!respuesta.ok) return { estado: "error", sala: null };
      return { estado: "lista", sala: await respuesta.json() };
    } catch {
      return { estado: "error", sala: null };
    }
  }, [codigo]);

  const refrescar = useCallback(async () => {
    const resultado = await traerSala();
    setSala(resultado.sala);
    setEstado(resultado.estado);
  }, [traerSala]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const resultado = await traerSala();
      if (cancelado) return;
      setSala(resultado.sala);
      setEstado(resultado.estado);
    })();
    return () => {
      cancelado = true;
    };
  }, [traerSala]);

  const borrarSala = async () => {
    await fetch(`/api/salas/creacion/${codigo}`, { method: "DELETE" });
    router.push("/stem/misiones");
  };

  const borrarMision = async (id: string) => {
    await fetch(`/api/salas/creacion/${codigo}/misiones/${id}`, { method: "DELETE" });
    await refrescar();
  };

  if (estado === "cargando") {
    return <Aviso titulo="Abriendo la sala…" texto="Un momento." />;
  }
  if (estado === "noExiste") {
    return (
      <Aviso
        titulo="No encontramos esa sala"
        texto="El código de creación puede estar mal escrito, o la sala ya caducó."
        volver
      />
    );
  }
  if (estado === "error" || !sala) {
    return (
      <Aviso
        titulo="No se pudo abrir la sala"
        texto="Revisá la conexión y volvé a intentar."
        volver
      />
    );
  }

  const urlJuego =
    typeof window !== "undefined"
      ? `${window.location.origin}/stem/misiones/jugar/${sala.codigoJuego}`
      : "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">La sala de nuestra clase</h1>
      <p className="mt-1 text-gray-600">
        Acá quedan guardados el código de la clase y todas las misiones que arman los grupos.
      </p>

      {/* Código de la clase: siempre visible durante la creación. */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">El código de nuestra clase</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACCIONES.map((accion) => (
            <li key={accion} className="rounded-lg border border-gray-200 p-2">
              <SimboloSvg
                dibujo={sala.simbolos[accion] ?? []}
                titulo={`Símbolo asociado a ${ETIQUETA_ACCION[accion]}`}
                className="aspect-square w-full"
              />
              <p className="mt-1 text-center text-xs font-bold uppercase tracking-wide text-gray-800">
                {ETIQUETA_ACCION[accion]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Los dos accesos. */}
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Código de creación</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sirve para volver a esta pantalla y armar misiones nuevas. Guardalo el docente: con
            este código también se borra la sala.
          </p>
          <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-gray-900">
            {formatearCodigo(sala.codigoCreacion)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Código de juego</h2>
          <p className="mt-1 text-sm text-gray-600">
            Este es el que se le pasa al grupo visitante. Abre la sala en modo solo juego: no
            permite editar ni borrar nada.
          </p>
          <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-gray-900">
            {formatearCodigo(sala.codigoJuego)}
          </p>
          {urlJuego && (
            <div className="mt-3 flex items-center gap-4">
              <QRCodeSVG value={urlJuego} size={116} />
              <p className="text-sm text-gray-600">
                Escaneando este código se entra directo al modo juego.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Misiones de la sala. */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            Misiones de la sala ({sala.misiones.length})
          </h2>
          <Link
            href={`/stem/misiones/sala/${codigo}/nueva`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
          >
            <Plus aria-hidden className="h-5 w-5" />
            Crear una misión
          </Link>
        </div>

        {sala.misiones.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-gray-700">
            Todavía no hay misiones. Cada grupo puede crear la suya con los símbolos del código.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {sala.misiones.map((mision) => (
              <li
                key={mision.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">Misión {mision.numero}</p>
                  <p className="text-sm text-gray-600">
                    {escenarioPorId(mision.escenarioId).nombre} ·{" "}
                    {nombrePersonaje(mision.personaje)} hasta {nombreObjetoMeta(mision.objetoMeta).toLowerCase()} ·
                    se resolvió con {mision.accionesDeLaSolucion} acciones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => borrarMision(mision.id)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Caducidad y borrado. */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Vigencia de la sala</h2>
        <p className="mt-1 text-sm text-gray-600">
          La sala se guarda de forma temporal y se borra sola si no se usa. Con el uso normal la
          fecha se renueva en cada visita. Vence el{" "}
          {new Date(sala.caducaEn).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>

        {confirmandoBorrado ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              Si borrás la sala se pierden el código de la clase y todas las misiones. No se puede
              deshacer.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={borrarSala}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
              >
                Sí, borrar la sala
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoBorrado(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Borrar sala
          </button>
        )}
      </section>
    </main>
  );
}

function Aviso({
  titulo,
  texto,
  volver = false,
}: {
  titulo: string;
  texto: string;
  volver?: boolean;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
      <p className="mt-2 text-gray-600">{texto}</p>
      {volver && (
        <Link
          href="/stem/misiones"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Volver al inicio
        </Link>
      )}
    </main>
  );
}
