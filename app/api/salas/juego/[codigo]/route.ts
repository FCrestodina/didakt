import { NextResponse } from "next/server";
import { normalizarCodigo } from "@/lib/stem/misiones/codigos";
import { aMisionPublica, listarMisiones, obtenerSalaParaJugar } from "@/lib/stem/misiones/salas";

export const dynamic = "force-dynamic";

/**
 * Modo solo juego.
 *
 * Es la única ruta que abre el código de juego, y solo tiene GET: no existe
 * ninguna operación de escritura bajo /api/salas/juego.
 *
 * La respuesta no incluye el código de creación ni la secuencia del grupo
 * autor. Quien juega recibe el escenario y el código de símbolos de la clase, y
 * arma su propia secuencia.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const sala = await obtenerSalaParaJugar(normalizarCodigo(codigo));

  if (!sala) {
    return NextResponse.json(
      { error: "No existe una sala de juego con ese código, o ya caducó." },
      { status: 404 },
    );
  }

  const filas = await listarMisiones(sala.id);

  return NextResponse.json({
    simbolos: sala.simbolos,
    misiones: filas.filter((m) => m.publicada).map(aMisionPublica),
  });
}
