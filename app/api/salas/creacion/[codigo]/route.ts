import { NextResponse } from "next/server";
import { normalizarCodigo } from "@/lib/stem/misiones/codigos";
import {
  aMisionDeAutor,
  borrarSala,
  listarMisiones,
  obtenerSalaParaEditar,
} from "@/lib/stem/misiones/salas";

export const dynamic = "force-dynamic";

/**
 * Modo de creación de una sala.
 *
 * Todo lo que hay bajo /api/salas/creacion exige el código de creación. El
 * código de juego no abre ninguna de estas rutas: la separación es estructural,
 * no una comprobación que se pueda olvidar.
 */

export async function GET(
  _peticion: Request,
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

  const filas = await listarMisiones(sala.id);

  return NextResponse.json({
    codigoCreacion: sala.codigoCreacion,
    codigoJuego: sala.codigoJuego,
    simbolos: sala.simbolos,
    caducaEn: sala.caducaEn,
    misiones: filas.map(aMisionDeAutor),
  });
}

/** Borrar la sala. Protegido por el código de creación (sección 2.3). */
export async function DELETE(
  _peticion: Request,
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

  await borrarSala(sala.id);
  return new NextResponse(null, { status: 204 });
}
