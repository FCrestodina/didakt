import { describe, expect, it } from "vitest";
import { ejecutarSecuencia } from "@/lib/stem/grid/motor";
import type { Accion, Tablero } from "@/lib/stem/grid/tipos";
import { MAX_REPETICIONES, agruparRepeticiones, expandirTramos } from "./agrupacion";

describe("agruparRepeticiones", () => {
  it("junta las acciones iguales consecutivas", () => {
    const tramos = agruparRepeticiones(["AVANZAR", "AVANZAR", "AVANZAR"]);
    expect(tramos).toHaveLength(1);
    expect(tramos[0].repeticiones).toBe(3);
  });

  it("no junta acciones iguales que no están seguidas", () => {
    const tramos = agruparRepeticiones(["AVANZAR", "GIRO_DERECHA_90", "AVANZAR"]);
    expect(tramos).toHaveLength(3);
    expect(tramos.every((t) => t.repeticiones === 1)).toBe(true);
  });

  it("no agrupa más allá del tope de la interfaz", () => {
    const cinco: Accion[] = Array.from({ length: 5 }, () => "AVANZAR");
    const tramos = agruparRepeticiones(cinco);
    expect(tramos).toHaveLength(2);
    expect(tramos[0].repeticiones).toBe(MAX_REPETICIONES);
    expect(tramos[1].repeticiones).toBe(1);
  });

  it("una secuencia vacía no produce tramos", () => {
    expect(agruparRepeticiones([])).toEqual([]);
  });

  it("los índices apuntan a las posiciones reales de la secuencia", () => {
    const tramos = agruparRepeticiones(["GIRO_DERECHA_90", "AVANZAR", "AVANZAR"]);
    expect(tramos[0].indices).toEqual([0]);
    expect(tramos[1].indices).toEqual([1, 2]);
  });
});

describe("la agrupación es reversible y no cambia lo que se ejecuta", () => {
  const casos: Accion[][] = [
    [],
    ["AVANZAR"],
    ["AVANZAR", "AVANZAR", "GIRO_DERECHA_90", "AVANZAR"],
    ["GIRO_IZQUIERDA_90", "GIRO_IZQUIERDA_90", "AVANZAR", "AVANZAR", "AVANZAR", "DETENER"],
    Array.from({ length: 12 }, () => "AVANZAR" as const),
  ];

  it("expandir lo agrupado devuelve exactamente la secuencia original", () => {
    for (const secuencia of casos) {
      expect(expandirTramos(agruparRepeticiones(secuencia))).toEqual(secuencia);
    }
  });

  it("la cantidad total de acciones se mantiene", () => {
    for (const secuencia of casos) {
      const total = agruparRepeticiones(secuencia).reduce((n, t) => n + t.repeticiones, 0);
      expect(total).toBe(secuencia.length);
    }
  });

  // La agrupación debe ejecutar exactamente la misma cantidad de acciones que la
  // secuencia expandida: se comprueba corriendo las dos en el motor.
  it("agrupada y expandida producen el mismo recorrido", () => {
    const tablero: Tablero = { filas: 6, columnas: 6, obstaculos: [{ fila: 2, columna: 3 }] };
    const inicio = { celda: { fila: 5, columna: 0 }, orientacion: "NORTE" as const };
    const meta = { fila: 0, columna: 4 };

    for (const secuencia of casos) {
      const original = ejecutarSecuencia(tablero, inicio, meta, secuencia);
      const reconstruida = ejecutarSecuencia(
        tablero,
        inicio,
        meta,
        expandirTramos(agruparRepeticiones(secuencia)),
      );
      expect(reconstruida).toEqual(original);
    }
  });
});
