import { NextResponse } from "next/server";
import { crearSala } from "@/lib/stem/misiones/salas";
import { parsearCodigoClase } from "@/lib/stem/misiones/trazos";

export const dynamic = "force-dynamic";

/**
 * Crea la sala de la clase con los cuatro símbolos ya acordados.
 *
 * No recibe ni guarda ningún dato de las personas: solo los trazos de los
 * símbolos. Los dibujos se vuelven a parsear acá antes de persistirlos, así que
 * nunca se guarda una estructura que no haya generado la propia aplicación.
 */
export async function POST(peticion: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await peticion.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const simbolos = parsearCodigoClase(
    (cuerpo as Record<string, unknown> | null)?.simbolos,
  );

  if (!simbolos) {
    return NextResponse.json(
      { error: "Faltan símbolos del código de la clase o alguno quedó vacío." },
      { status: 400 },
    );
  }

  try {
    const sala = await crearSala(simbolos);
    return NextResponse.json(sala, { status: 201 });
  } catch (error) {
    console.error("No se pudo crear la sala", error);
    return NextResponse.json(
      { error: "No se pudo crear la sala. Probá de nuevo en un momento." },
      { status: 500 },
    );
  }
}
