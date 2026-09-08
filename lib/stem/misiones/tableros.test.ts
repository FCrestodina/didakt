import { describe, expect, it } from "vitest";
import {
  admiteMisionNoTrivial,
  admiteVariasRutas,
  analizarMision,
  celdasLibres,
} from "@/lib/stem/grid/analisis";
import { celdaTransitable } from "@/lib/stem/grid/motor";
import { ORIENTACIONES } from "@/lib/stem/grid/tipos";
import { ESCENARIOS, LADO_TABLERO, escenarioPorId } from "./tableros";

describe("escenarios del Creador de misiones", () => {
  it("hay cuatro escenarios", () => {
    expect(ESCENARIOS).toHaveLength(4);
  });

  it("todos tienen la misma cantidad de filas y columnas", () => {
    for (const escenario of ESCENARIOS) {
      expect(escenario.tablero.filas, escenario.nombre).toBe(LADO_TABLERO);
      expect(escenario.tablero.columnas, escenario.nombre).toBe(LADO_TABLERO);
    }
  });

  it("cada escenario tiene una disposición de obstáculos distinta", () => {
    const huellas = ESCENARIOS.map((e) =>
      e.tablero.obstaculos
        .map((o) => `${o.fila},${o.columna}`)
        .sort()
        .join("|"),
    );
    expect(new Set(huellas).size).toBe(ESCENARIOS.length);
  });

  it("los obstáculos caen dentro del tablero", () => {
    for (const escenario of ESCENARIOS) {
      for (const o of escenario.tablero.obstaculos) {
        expect(o.fila, escenario.nombre).toBeGreaterThanOrEqual(0);
        expect(o.fila, escenario.nombre).toBeLessThan(escenario.tablero.filas);
        expect(o.columna, escenario.nombre).toBeGreaterThanOrEqual(0);
        expect(o.columna, escenario.nombre).toBeLessThan(escenario.tablero.columnas);
      }
    }
  });

  // Buena legibilidad visual: si el tablero se llena de obstáculos deja de
  // leerse a simple vista en una tableta.
  it("ningún escenario tapa más de un cuarto de los casilleros", () => {
    for (const escenario of ESCENARIOS) {
      const total = escenario.tablero.filas * escenario.tablero.columnas;
      expect(escenario.tablero.obstaculos.length / total, escenario.nombre).toBeLessThanOrEqual(
        0.25,
      );
    }
  });
});

describe("los escenarios permiten armar misiones válidas", () => {
  it("todos admiten al menos una misión no trivial", () => {
    for (const escenario of ESCENARIOS) {
      expect(admiteMisionNoTrivial(escenario.tablero), escenario.nombre).toBe(true);
    }
  });

  // Sección 4.2: al menos dos tableros deben permitir más de un recorrido válido.
  it("al menos dos escenarios admiten más de un recorrido válido", () => {
    const conVariasRutas = ESCENARIOS.filter((e) => admiteVariasRutas(e.tablero));
    expect(conVariasRutas.length).toBeGreaterThanOrEqual(2);
  });

  it("ningún escenario deja celdas libres aisladas del resto", () => {
    for (const escenario of ESCENARIOS) {
      const libres = celdasLibres(escenario.tablero);
      const origen = libres[0];
      for (const meta of libres.slice(1)) {
        const analisis = analizarMision(
          escenario.tablero,
          { celda: origen, orientacion: "NORTE" },
          meta,
        );
        expect(
          analisis.alcanzable,
          `${escenario.nombre}: no se llega a ${meta.fila},${meta.columna}`,
        ).toBe(true);
      }
    }
  });

  it("cada escenario deja lugar de sobra para elegir salida y meta", () => {
    for (const escenario of ESCENARIOS) {
      expect(celdasLibres(escenario.tablero).length, escenario.nombre).toBeGreaterThanOrEqual(24);
    }
  });

  it("en todos los escenarios hay salidas válidas en las cuatro orientaciones", () => {
    for (const escenario of ESCENARIOS) {
      for (const orientacion of ORIENTACIONES) {
        const hayAlguna = celdasLibres(escenario.tablero).some((salida) =>
          celdasLibres(escenario.tablero).some(
            (meta) =>
              !(meta.fila === salida.fila && meta.columna === salida.columna) &&
              !analizarMision(escenario.tablero, { celda: salida, orientacion }, meta).trivial &&
              analizarMision(escenario.tablero, { celda: salida, orientacion }, meta).alcanzable,
          ),
        );
        expect(hayAlguna, `${escenario.nombre} · ${orientacion}`).toBe(true);
      }
    }
  });
});

describe("escenarioPorId", () => {
  it("devuelve el escenario pedido", () => {
    expect(escenarioPorId(3).nombre).toBe("La plaza");
  });

  it("cae en el primero ante un id desconocido", () => {
    expect(escenarioPorId(99).id).toBe(1);
  });

  it("todas las celdas de obstáculo son intransitables", () => {
    for (const escenario of ESCENARIOS) {
      for (const o of escenario.tablero.obstaculos) {
        expect(celdaTransitable(escenario.tablero, o), escenario.nombre).toBe(false);
      }
    }
  });
});
