import { NextResponse } from "next/server";
import { normalizarCodigo } from "@/lib/stem/misiones/codigos";
import { borrarMision, obtenerSalaParaEditar } from "@/lib/stem/misiones/salas";

export const dynamic = "force-dynamic";

/** Quita una misión de la sala. Requiere el código de creación. */
export async function DELETE(
  _peticion: Request,
  { params }: { params: Promise<{ codigo: string; id: string }> },
) {
  const { codigo, id } = await params;
  const sala = await obtenerSalaParaEditar(normalizarCodigo(codigo));

  if (!sala) {
    return NextResponse.json(
      { error: "No existe una sala con ese código de creación, o ya caducó." },
      { status: 404 },
    );
  }

  await borrarMision(sala.id, id);
  return new NextResponse(null, { status: 204 });
}
