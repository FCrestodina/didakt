import { describe, expect, it } from "vitest";
import type { Accion } from "@/lib/stem/grid/tipos";
import { escenarioPorId } from "./tableros";
import {
  MAX_ACCIONES,
  parsearMision,
  validarConfiguracion,
  validarSecuenciaAutora,
  type ConfiguracionMision,
} from "./validacion";

/** Configuración base sobre "El patio", con obstáculos en (2,2) y (3,4). */
function config(cambios: Partial<ConfiguracionMision> = {}): ConfiguracionMision {
  return {
    escenarioId: 1,
    personaje: "carrito",
    objetoMeta: "bandera",
    salida: { fila: 5, columna: 0 },
    orientacion: "NORTE",
    meta: { fila: 0, columna: 3 },
    ...cambios,
  };
}

function campos(problemas: { campo: string }[]): string[] {
  return problemas.map((p) => p.campo);
}

describe("validarConfiguracion · configuraciones imposibles", () => {
  it("acepta una configuración válida y no trivial", () => {
    expect(validarConfiguracion(config())).toEqual([]);
  });

  it("rechaza una salida sobre un obstáculo", () => {
    const problemas = validarConfiguracion(config({ salida: { fila: 2, columna: 2 } }));
    expect(campos(problemas)).toContain("salida");
  });

  it("rechaza una meta sobre un obstáculo", () => {
    const problemas = validarConfiguracion(config({ meta: { fila: 3, columna: 4 } }));
    expect(campos(problemas)).toContain("meta");
  });

  it("rechaza la misma celda para salida y meta", () => {
    const problemas = validarConfiguracion(
      config({ salida: { fila: 1, columna: 1 }, meta: { fila: 1, columna: 1 } }),
    );
    expect(campos(problemas)).toContain("meta");
  });

  it("rechaza una salida fuera del tablero", () => {
    expect(campos(validarConfiguracion(config({ salida: { fila: 9, columna: 0 } })))).toContain(
      "salida",
    );
    expect(campos(validarConfiguracion(config({ meta: { fila: -1, columna: 0 } })))).toContain(
      "meta",
    );
  });

  it("rechaza un escenario inexistente", () => {
    expect(campos(validarConfiguracion(config({ escenarioId: 99 })))).toEqual(["escenario"]);
  });

  it("rechaza un personaje o un objeto que no están en el catálogo", () => {
    expect(campos(validarConfiguracion(config({ personaje: "dragon" })))).toContain("personaje");
    expect(campos(validarConfiguracion(config({ objetoMeta: "tesoro" })))).toContain("objetoMeta");
  });
});

describe("validarConfiguracion · misiones triviales", () => {
  // Sección 4.2: si se resuelve sin ningún giro, se pide otra ubicación.
  it("rechaza una meta que se alcanza avanzando derecho", () => {
    const problemas = validarConfiguracion(
      config({ salida: { fila: 5, columna: 0 }, orientacion: "NORTE", meta: { fila: 0, columna: 0 } }),
    );
    expect(campos(problemas)).toContain("meta");
    expect(problemas[0].mensaje).toContain("sin ningún giro");
  });

  it("rechaza una meta que se alcanza con una sola acción", () => {
    const problemas = validarConfiguracion(
      config({ salida: { fila: 5, columna: 0 }, orientacion: "NORTE", meta: { fila: 4, columna: 0 } }),
    );
    expect(campos(problemas)).toContain("meta");
  });

  it("acepta la misma meta si la orientación inicial obliga a girar", () => {
    expect(
      validarConfiguracion(
        config({
          salida: { fila: 5, columna: 0 },
          orientacion: "ESTE",
          meta: { fila: 0, columna: 0 },
        }),
      ),
    ).toEqual([]);
  });
});

describe("validarSecuenciaAutora", () => {
  const base = config();

  /** Resuelve la misión base: subir cinco, girar a la derecha, avanzar tres. */
  const solucion: Accion[] = [
    "AVANZAR",
    "AVANZAR",
    "AVANZAR",
    "AVANZAR",
    "AVANZAR",
    "GIRO_DERECHA_90",
    "AVANZAR",
    "AVANZAR",
    "AVANZAR",
  ];

  it("acepta una secuencia que llega a la meta", () => {
    expect(validarSecuenciaAutora(base, solucion)).toEqual([]);
  });

  it("rechaza una secuencia vacía", () => {
    expect(campos(validarSecuenciaAutora(base, []))).toEqual(["secuencia"]);
  });

  it("rechaza una secuencia que no llega a la meta", () => {
    expect(campos(validarSecuenciaAutora(base, ["AVANZAR", "AVANZAR"]))).toEqual(["secuencia"]);
  });

  it("rechaza una secuencia más larga que el tope de Primer Ciclo", () => {
    const larga = Array.from({ length: MAX_ACCIONES + 1 }, () => "AVANZAR" as const);
    const problemas = validarSecuenciaAutora(base, larga);
    expect(problemas[0].mensaje).toContain(String(MAX_ACCIONES));
  });

  // No se valida contra una respuesta correcta única: cualquier secuencia que
  // llegue a la meta respetando las reglas es válida.
  it("acepta una segunda solución distinta de la primera", () => {
    const otra: Accion[] = [
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
    ];
    expect(validarSecuenciaAutora(base, otra)).toEqual([]);
    expect(otra).not.toEqual(solucion);
  });

  it("una secuencia que se detiene antes de la meta no alcanza", () => {
    expect(campos(validarSecuenciaAutora(base, [...solucion.slice(0, 3), "DETENER"]))).toEqual([
      "secuencia",
    ]);
  });
});

describe("parsearMision", () => {
  const cuerpoValido = {
    escenarioId: 1,
    personaje: "carrito",
    objetoMeta: "bandera",
    salida: { fila: 5, columna: 0 },
    orientacion: "NORTE",
    meta: { fila: 0, columna: 3 },
    secuencia: [
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
    ],
  };

  it("acepta un cuerpo válido", () => {
    const resultado = parsearMision(cuerpoValido);
    expect(resultado.ok).toBe(true);
  });

  it("rechaza cuerpos que no son objetos", () => {
    expect(parsearMision(null).ok).toBe(false);
    expect(parsearMision("hola").ok).toBe(false);
    expect(parsearMision(42).ok).toBe(false);
  });

  it("rechaza una orientación que no existe", () => {
    expect(parsearMision({ ...cuerpoValido, orientacion: "ARRIBA" }).ok).toBe(false);
  });

  it("rechaza acciones que no están en el repertorio", () => {
    expect(parsearMision({ ...cuerpoValido, secuencia: ["SALTAR"] }).ok).toBe(false);
  });

  it("rechaza coordenadas que no son números enteros", () => {
    expect(parsearMision({ ...cuerpoValido, salida: { fila: "5", columna: 0 } }).ok).toBe(false);
    expect(parsearMision({ ...cuerpoValido, meta: { fila: 1.5, columna: 0 } }).ok).toBe(false);
  });

  it("rechaza una misión sin solución comprobada", () => {
    const resultado = parsearMision({ ...cuerpoValido, secuencia: ["AVANZAR"] });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(campos(resultado.problemas)).toContain("secuencia");
  });

  it("el escenario guardado es el que pidió el cuerpo", () => {
    const resultado = parsearMision(cuerpoValido);
    if (resultado.ok) {
      expect(escenarioPorId(resultado.config.escenarioId).nombre).toBe("El patio");
    }
  });
});
