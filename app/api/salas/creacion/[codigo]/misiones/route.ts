import { NextResponse } from "next/server";
import { normalizarCodigo } from "@/lib/stem/misiones/codigos";
import {
  MAX_MISIONES_POR_SALA,
  aMisionDeAutor,
  crearMision,
  obtenerSalaParaEditar,
} from "@/lib/stem/misiones/salas";
import { parsearMision } from "@/lib/stem/misiones/validacion";

export const dynamic = "force-dynamic";

/**
 * Alta de una misión dentro de la sala.
 *
 * La validación del cliente no alcanza: acá se vuelve a comprobar que la
 * configuración sea posible, que la misión no sea trivial y que la secuencia
 * del grupo autor efectivamente llegue a la meta. Sin solución comprobada no se
 * publica (criterio de aceptación del manual).
 */
export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const sala = await obtenerSalaParaEditar(normalizarCodigo(codigo));

  if (!sala) {
    return NextResponse.json(
      { error: "No existe una sala con ese código de creación, o ya caducó." },
      { status: 404 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await peticion.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const parseada = parsearMision(cuerpo);
  if (!parseada.ok) {
    return NextResponse.json({ problemas: parseada.problemas }, { status: 400 });
  }

  const fila = await crearMision(sala.id, parseada.config, parseada.secuencia);
  if (!fila) {
    return NextResponse.json(
      { error: `Esta sala ya llegó a ${MAX_MISIONES_POR_SALA} misiones.` },
      { status: 409 },
    );
  }

  return NextResponse.json({ mision: aMisionDeAutor(fila) }, { status: 201 });
}
