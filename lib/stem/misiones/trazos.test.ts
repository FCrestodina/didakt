import { describe, expect, it } from "vitest";
import { ACCIONES } from "@/lib/stem/grid/tipos";
import {
  MAX_PUNTOS_POR_TRAZO,
  MAX_TRAZOS,
  dibujoAPath,
  dibujoVacio,
  parsearCodigoClase,
  parsearDibujo,
  type Dibujo,
  type Trazo,
} from "./trazos";

/** Un dibujo mínimo pero válido. */
const TRAZO: Trazo = [
  [0.1, 0.1],
  [0.5, 0.5],
  [0.9, 0.2],
];

function codigoCompleto(): Record<string, unknown> {
  return Object.fromEntries(ACCIONES.map((a) => [a, [TRAZO]]));
}

describe("parsearDibujo", () => {
  it("acepta una lista de trazos con puntos válidos", () => {
    expect(parsearDibujo([TRAZO])).toEqual([TRAZO]);
  });

  it("rechaza lo que no es una lista", () => {
    expect(parsearDibujo("<svg/>")).toBeNull();
    expect(parsearDibujo({ trazos: [] })).toBeNull();
    expect(parsearDibujo(null)).toBeNull();
  });

  it("rechaza puntos que no son pares de números", () => {
    expect(parsearDibujo([[[0.1]]])).toBeNull();
    expect(parsearDibujo([[["0.1", "0.2"]]])).toBeNull();
    expect(parsearDibujo([[[0.1, 0.2, 0.3]]])).toBeNull();
  });

  it("rechaza valores no finitos", () => {
    expect(parsearDibujo([[[Number.NaN, 0.2]]])).toBeNull();
    expect(parsearDibujo([[[Number.POSITIVE_INFINITY, 0.2]]])).toBeNull();
  });

  // Los trazos llegan normalizados entre 0 y 1: cualquier cosa fuera de rango
  // se recorta en vez de guardarse tal cual.
  it("recorta las coordenadas al rango del lienzo", () => {
    expect(parsearDibujo([[[-5, 12]]])).toEqual([[[0, 1]]]);
  });

  it("redondea a tres decimales", () => {
    expect(parsearDibujo([[[0.123456789, 0.987654321]]])).toEqual([[[0.123, 0.988]]]);
  });

  it("descarta los trazos sin ningún punto", () => {
    expect(parsearDibujo([[], TRAZO, []])).toEqual([TRAZO]);
  });

  it("rechaza dibujos que superan los topes de tamaño", () => {
    const demasiadosTrazos = Array.from({ length: MAX_TRAZOS + 1 }, () => TRAZO);
    expect(parsearDibujo(demasiadosTrazos)).toBeNull();

    const trazoLargo = Array.from({ length: MAX_PUNTOS_POR_TRAZO + 1 }, () => [0.5, 0.5]);
    expect(parsearDibujo([trazoLargo])).toBeNull();
  });
});

describe("dibujoVacio", () => {
  it("un dibujo sin trazos está vacío", () => {
    expect(dibujoVacio([])).toBe(true);
  });

  it("un dibujo solo con trazos vacíos está vacío", () => {
    expect(dibujoVacio([[], []])).toBe(true);
  });

  it("un dibujo con un punto no está vacío", () => {
    expect(dibujoVacio([[[0.5, 0.5]]])).toBe(false);
  });
});

describe("parsearCodigoClase", () => {
  it("acepta los cuatro símbolos dibujados", () => {
    const codigo = parsearCodigoClase(codigoCompleto());
    expect(codigo).not.toBeNull();
    for (const accion of ACCIONES) {
      expect(codigo![accion]).toEqual([TRAZO]);
    }
  });

  // La aplicación debe impedir guardar si alguno de los cuatro casilleros está
  // vacío (sección 3.1 del manual).
  it("rechaza el código si falta algún símbolo", () => {
    const incompleto = codigoCompleto();
    delete incompleto.DETENER;
    expect(parsearCodigoClase(incompleto)).toBeNull();
  });

  it("rechaza el código si algún símbolo quedó en blanco", () => {
    expect(parsearCodigoClase({ ...codigoCompleto(), AVANZAR: [] })).toBeNull();
    expect(parsearCodigoClase({ ...codigoCompleto(), AVANZAR: [[]] })).toBeNull();
  });

  it("rechaza cualquier cosa que no sea un objeto", () => {
    expect(parsearCodigoClase(null)).toBeNull();
    expect(parsearCodigoClase("AVANZAR")).toBeNull();
  });

  it("ignora las claves que no son acciones del repertorio", () => {
    const codigo = parsearCodigoClase({ ...codigoCompleto(), SALTAR: [TRAZO] });
    expect(codigo).not.toBeNull();
    expect(Object.keys(codigo!).sort()).toEqual([...ACCIONES].sort());
  });
});

describe("dibujoAPath", () => {
  it("arma un path a partir de los puntos, escalado al lado pedido", () => {
    expect(dibujoAPath([[[0, 0], [1, 1]]], 100)).toBe("M 0 0 L 100 100");
  });

  it("dibuja un punto suelto como un segmento mínimo", () => {
    expect(dibujoAPath([[[0.5, 0.5]]], 100)).toContain("M 50 50");
  });

  it("concatena varios trazos", () => {
    const dibujo: Dibujo = [
      [
        [0, 0],
        [1, 0],
      ],
      [
        [0, 1],
        [1, 1],
      ],
    ];
    expect(dibujoAPath(dibujo, 10)).toBe("M 0 0 L 10 0 M 0 10 L 10 10");
  });

  it("no genera nada para un dibujo vacío", () => {
    expect(dibujoAPath([], 100)).toBe("");
    expect(dibujoAPath([[]], 100)).toBe("");
  });

  // El path se arma solo con números ya validados: nunca se interpola texto del
  // usuario, así que no hay forma de inyectar marcado.
  it("el path resultante solo tiene comandos y números", () => {
    const path = dibujoAPath([TRAZO], 100);
    expect(path).toMatch(/^[ML0-9.\s-]+$/);
  });
});
