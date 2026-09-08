import { describe, expect, it } from "vitest";
import { analizarMision } from "@/lib/stem/grid/analisis";
import { celdaTransitable, ejecutarSecuencia, mismaCelda } from "@/lib/stem/grid/motor";
import { MISIONES, misionPorId } from "./misiones";

/** Cuántos giros tiene una secuencia. */
function contarGiros(acciones: readonly string[]): number {
  return acciones.filter((a) => a.startsWith("GIRO_")).length;
}

describe("misiones del Robot mensajero", () => {
  // RF-08: debe ofrecer al menos tres misiones.
  it("hay al menos tres misiones", () => {
    expect(MISIONES.length).toBeGreaterThanOrEqual(3);
  });

  it("cada misión tiene una configuración válida", () => {
    for (const mision of MISIONES) {
      const contexto = `misión ${mision.id}`;
      expect(celdaTransitable(mision.tablero, mision.inicio.celda), contexto).toBe(true);
      expect(celdaTransitable(mision.tablero, mision.destino), contexto).toBe(true);
      expect(mismaCelda(mision.inicio.celda, mision.destino), contexto).toBe(false);
    }
  });

  it("todas las misiones son resolubles con el repertorio de acciones", () => {
    for (const mision of MISIONES) {
      const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
      expect(analisis.alcanzable, `misión ${mision.id}`).toBe(true);

      // La solución mínima que encuentra el análisis realmente llega al destino.
      const resultado = ejecutarSecuencia(
        mision.tablero,
        mision.inicio,
        mision.destino,
        analisis.solucionMinima!,
      );
      expect(resultado.exito, `misión ${mision.id}`).toBe(true);
    }
  });

  // Sección 10.1: en la misión diagnóstica no se muestra el repertorio antes
  // del primer intento.
  it("ninguna misión muestra el repertorio de acciones por defecto", () => {
    for (const mision of MISIONES) {
      expect(mision.mostrarRepertorioPorDefecto, `misión ${mision.id}`).toBe(false);
    }
  });

  it("misionPorId devuelve la primera misión ante un id desconocido", () => {
    expect(misionPorId(1).id).toBe(1);
    expect(misionPorId(99).id).toBe(1);
  });
});

describe("misión 1 · Primer envío", () => {
  const mision = misionPorId(1);

  it("es un recorrido corto de una recta y un giro", () => {
    const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
    expect(analisis.longitudMinima).toBe(5);
    expect(contarGiros(analisis.solucionMinima!)).toBe(1);
  });

  it("no se resuelve avanzando derecho: hace falta girar", () => {
    const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
    expect(analisis.hayRectaSinGiros).toBe(false);
    expect(analisis.trivial).toBe(false);
  });
});

describe("misión 2 · Camino con obstáculo", () => {
  const mision = misionPorId(2);

  it("tiene obstáculos que obligan a cambiar de dirección varias veces", () => {
    expect(mision.tablero.obstaculos.length).toBeGreaterThan(0);
    const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
    expect(contarGiros(analisis.solucionMinima!)).toBeGreaterThanOrEqual(3);
  });

  it("exige controlar cantidades: el recorrido mínimo es largo", () => {
    const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
    expect(analisis.longitudMinima).toBeGreaterThanOrEqual(8);
  });

  it("una instrucción válida que va contra un obstáculo no lo atraviesa", () => {
    // Desde la salida, mirando al norte, el segundo casillero está ocupado.
    const resultado = ejecutarSecuencia(
      mision.tablero,
      mision.inicio,
      mision.destino,
      ["AVANZAR", "AVANZAR", "AVANZAR"],
    );
    expect(resultado.motivo).toBe("OBSTACULO");
    expect(resultado.accionesAplicadas).toBe(1);
    expect(resultado.estadoFinal.celda).toEqual({ fila: 3, columna: 0 });
  });
});

describe("misión 3 · Dos rutas posibles", () => {
  const mision = misionPorId(3);

  it("el destino se alcanza por más de un recorrido válido de la misma longitud", () => {
    const analisis = analizarMision(mision.tablero, mision.inicio, mision.destino);
    expect(analisis.solucionesMinimas).toBeGreaterThan(1);
  });

  it("rodear el obstáculo por arriba y por abajo cuesta lo mismo y las dos llegan", () => {
    const porArriba = ejecutarSecuencia(mision.tablero, mision.inicio, mision.destino, [
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
    ]);
    const porAbajo = ejecutarSecuencia(mision.tablero, mision.inicio, mision.destino, [
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
    ]);

    expect(porArriba.exito).toBe(true);
    expect(porAbajo.exito).toBe(true);
    expect(porArriba.pasos.length).toBe(porAbajo.pasos.length);
  });
});
