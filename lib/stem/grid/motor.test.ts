import { describe, expect, it } from "vitest";
import {
  celdaAdelante,
  celdaTransitable,
  ejecutarSecuencia,
  esObstaculo,
  expandirAvanzar,
  girar,
  mismaCelda,
} from "./motor";
import type { Accion, Celda, Estado, Tablero } from "./tipos";

/** Tablero 6x6 sin obstáculos, la medida de referencia del manual. */
const LIBRE: Tablero = { filas: 6, columnas: 6, obstaculos: [] };

function estado(fila: number, columna: number, orientacion: Estado["orientacion"]): Estado {
  return { celda: { fila, columna }, orientacion };
}

describe("girar", () => {
  it("rota 90 grados a la derecha recorriendo las cuatro orientaciones", () => {
    expect(girar("NORTE", "derecha")).toBe("ESTE");
    expect(girar("ESTE", "derecha")).toBe("SUR");
    expect(girar("SUR", "derecha")).toBe("OESTE");
    expect(girar("OESTE", "derecha")).toBe("NORTE");
  });

  it("rota 90 grados a la izquierda recorriendo las cuatro orientaciones", () => {
    expect(girar("NORTE", "izquierda")).toBe("OESTE");
    expect(girar("OESTE", "izquierda")).toBe("SUR");
    expect(girar("SUR", "izquierda")).toBe("ESTE");
    expect(girar("ESTE", "izquierda")).toBe("NORTE");
  });

  // Criterio de aceptación del manual del Robot: "La derecha y la izquierda se
  // calculan desde la orientación del robot".
  it("calcula la derecha desde la orientación del dispositivo y no desde la pantalla", () => {
    // Mirando hacia abajo, la derecha del dispositivo apunta a la izquierda de la pantalla.
    expect(girar("SUR", "derecha")).toBe("OESTE");
    expect(girar("SUR", "izquierda")).toBe("ESTE");
  });

  it("cuatro giros al mismo lado devuelven la orientación original", () => {
    let o = girar("NORTE", "derecha");
    o = girar(o, "derecha");
    o = girar(o, "derecha");
    o = girar(o, "derecha");
    expect(o).toBe("NORTE");
  });
});

describe("celdaAdelante", () => {
  it("apunta a la celda contigua según la orientación, con la fila creciendo hacia abajo", () => {
    expect(celdaAdelante(estado(3, 3, "NORTE"))).toEqual({ fila: 2, columna: 3 });
    expect(celdaAdelante(estado(3, 3, "SUR"))).toEqual({ fila: 4, columna: 3 });
    expect(celdaAdelante(estado(3, 3, "ESTE"))).toEqual({ fila: 3, columna: 4 });
    expect(celdaAdelante(estado(3, 3, "OESTE"))).toEqual({ fila: 3, columna: 2 });
  });
});

describe("celdas y obstáculos", () => {
  const conObstaculo: Tablero = {
    filas: 4,
    columnas: 4,
    obstaculos: [{ fila: 1, columna: 1 }],
  };

  it("reconoce una celda con obstáculo", () => {
    expect(esObstaculo(conObstaculo, { fila: 1, columna: 1 })).toBe(true);
    expect(esObstaculo(conObstaculo, { fila: 1, columna: 2 })).toBe(false);
  });

  it("una celda fuera del tablero no es transitable", () => {
    expect(celdaTransitable(conObstaculo, { fila: -1, columna: 0 })).toBe(false);
    expect(celdaTransitable(conObstaculo, { fila: 4, columna: 0 })).toBe(false);
    expect(celdaTransitable(conObstaculo, { fila: 0, columna: 4 })).toBe(false);
    expect(celdaTransitable(conObstaculo, { fila: 0, columna: -1 })).toBe(false);
  });

  it("mismaCelda compara por coordenadas y no por identidad", () => {
    const a: Celda = { fila: 2, columna: 2 };
    expect(mismaCelda(a, { fila: 2, columna: 2 })).toBe(true);
    expect(mismaCelda(a, { fila: 2, columna: 3 })).toBe(false);
  });
});

describe("ejecutarSecuencia · movimiento básico", () => {
  it("AVANZAR mueve exactamente un casillero en la dirección actual", () => {
    const r = ejecutarSecuencia(LIBRE, estado(3, 3, "ESTE"), { fila: 0, columna: 0 }, [
      "AVANZAR",
    ]);
    expect(r.estadoFinal.celda).toEqual({ fila: 3, columna: 4 });
    expect(r.estadoFinal.orientacion).toBe("ESTE");
    expect(r.accionesAplicadas).toBe(1);
  });

  it("los giros cambian la orientación sin cambiar de casillero", () => {
    const r = ejecutarSecuencia(LIBRE, estado(2, 2, "NORTE"), { fila: 0, columna: 0 }, [
      "GIRO_DERECHA_90",
      "GIRO_DERECHA_90",
    ]);
    expect(r.estadoFinal.celda).toEqual({ fila: 2, columna: 2 });
    expect(r.estadoFinal.orientacion).toBe("SUR");
  });

  it("una secuencia que termina sin llegar deja la pieza en la última posición", () => {
    const r = ejecutarSecuencia(LIBRE, estado(0, 0, "ESTE"), { fila: 5, columna: 5 }, [
      "AVANZAR",
      "AVANZAR",
    ]);
    expect(r.motivo).toBe("SECUENCIA_COMPLETA");
    expect(r.exito).toBe(false);
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 2 });
  });

  it("una secuencia vacía no mueve nada", () => {
    const r = ejecutarSecuencia(LIBRE, estado(1, 1, "NORTE"), { fila: 5, columna: 5 }, []);
    expect(r.pasos).toHaveLength(0);
    expect(r.motivo).toBe("SECUENCIA_COMPLETA");
    expect(r.estadoFinal).toEqual(estado(1, 1, "NORTE"));
  });
});

describe("ejecutarSecuencia · bloqueos del entorno", () => {
  const conMuro: Tablero = {
    filas: 6,
    columnas: 6,
    obstaculos: [{ fila: 3, columna: 4 }],
  };

  it("un obstáculo detiene la ejecución antes de ocupar la celda", () => {
    const r = ejecutarSecuencia(conMuro, estado(3, 3, "ESTE"), { fila: 5, columna: 5 }, [
      "AVANZAR",
      "AVANZAR",
    ]);
    expect(r.motivo).toBe("OBSTACULO");
    expect(r.estadoFinal.celda).toEqual({ fila: 3, columna: 3 });
    expect(r.accionesAplicadas).toBe(0);
    expect(r.indiceBloqueo).toBe(0);
    expect(r.pasos[0].aplicada).toBe(false);
  });

  it("no atraviesa el obstáculo aunque queden acciones por ejecutar", () => {
    const r = ejecutarSecuencia(conMuro, estado(3, 3, "ESTE"), { fila: 3, columna: 5 }, [
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
    ]);
    expect(r.exito).toBe(false);
    expect(r.pasos).toHaveLength(1);
  });

  it("el límite del tablero detiene la ejecución", () => {
    const r = ejecutarSecuencia(LIBRE, estado(0, 0, "NORTE"), { fila: 5, columna: 5 }, [
      "AVANZAR",
    ]);
    expect(r.motivo).toBe("FUERA_DEL_TABLERO");
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 0 });
    expect(r.indiceBloqueo).toBe(0);
  });

  it("distingue el bloqueo por obstáculo del bloqueo por límite del tablero", () => {
    const borde = ejecutarSecuencia(LIBRE, estado(5, 5, "SUR"), { fila: 0, columna: 0 }, [
      "AVANZAR",
    ]);
    const muro = ejecutarSecuencia(conMuro, estado(3, 3, "ESTE"), { fila: 0, columna: 0 }, [
      "AVANZAR",
    ]);
    expect(borde.motivo).toBe("FUERA_DEL_TABLERO");
    expect(muro.motivo).toBe("OBSTACULO");
  });
});

describe("ejecutarSecuencia · DETENER", () => {
  it("DETENER antes de la meta finaliza la ejecución en la celda actual", () => {
    const r = ejecutarSecuencia(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 5 }, [
      "AVANZAR",
      "DETENER",
      "AVANZAR",
    ]);
    expect(r.motivo).toBe("DETENIDO");
    expect(r.exito).toBe(false);
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 1 });
    // La tercera acción nunca se ejecuta.
    expect(r.pasos).toHaveLength(2);
  });

  it("DETENER justo sobre la meta cuenta como misión cumplida", () => {
    const r = ejecutarSecuencia(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 1 }, [
      "AVANZAR",
      "DETENER",
    ]);
    // Llegar a la meta ya cortó la ejecución en la primera acción.
    expect(r.motivo).toBe("META_ALCANZADA");
    expect(r.exito).toBe(true);
  });
});

describe("ejecutarSecuencia · llegada a la meta", () => {
  it("entrar en la celda-meta corta la ejecución con éxito", () => {
    const r = ejecutarSecuencia(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 2 }, [
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
      "AVANZAR",
    ]);
    expect(r.motivo).toBe("META_ALCANZADA");
    expect(r.exito).toBe(true);
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 2 });
    expect(r.pasos).toHaveLength(2);
  });

  it("arrancar sobre la meta se resuelve sin ejecutar ninguna acción", () => {
    const r = ejecutarSecuencia(LIBRE, estado(2, 2, "NORTE"), { fila: 2, columna: 2 }, [
      "AVANZAR",
    ]);
    expect(r.exito).toBe(true);
    expect(r.pasos).toHaveLength(0);
  });

  // Criterio de aceptación: "Una misión puede ser resuelta por una secuencia
  // distinta de la secuencia autora si también llega válidamente a la meta".
  it("acepta dos secuencias distintas que llegan a la misma meta", () => {
    const inicio = estado(0, 0, "ESTE");
    const meta: Celda = { fila: 2, columna: 2 };

    const primeroDerecha: Accion[] = [
      "AVANZAR",
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
    ];
    const primeroAbajo: Accion[] = [
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
      "AVANZAR",
    ];

    expect(ejecutarSecuencia(LIBRE, inicio, meta, primeroDerecha).exito).toBe(true);
    expect(ejecutarSecuencia(LIBRE, inicio, meta, primeroAbajo).exito).toBe(true);
  });

  // Criterio de aceptación: "Cambiar el orden de dos instrucciones puede
  // producir un recorrido diferente".
  it("cambiar el orden de dos instrucciones cambia el recorrido", () => {
    const inicio = estado(2, 2, "NORTE");
    const meta: Celda = { fila: 5, columna: 5 };

    const a = ejecutarSecuencia(LIBRE, inicio, meta, ["AVANZAR", "GIRO_DERECHA_90"]);
    const b = ejecutarSecuencia(LIBRE, inicio, meta, ["GIRO_DERECHA_90", "AVANZAR"]);

    expect(a.estadoFinal.celda).toEqual({ fila: 1, columna: 2 });
    expect(b.estadoFinal.celda).toEqual({ fila: 2, columna: 3 });
    expect(a.estadoFinal.celda).not.toEqual(b.estadoFinal.celda);
  });
});

describe("ejecutarSecuencia · determinismo", () => {
  it("misma secuencia y mismo estado inicial dan siempre el mismo resultado", () => {
    const tablero: Tablero = {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 1, columna: 2 },
        { fila: 3, columna: 3 },
      ],
    };
    const secuencia: Accion[] = [
      "AVANZAR",
      "GIRO_DERECHA_90",
      "AVANZAR",
      "AVANZAR",
      "GIRO_IZQUIERDA_90",
      "AVANZAR",
    ];
    const primera = ejecutarSecuencia(tablero, estado(0, 0, "SUR"), { fila: 5, columna: 5 }, secuencia);
    const segunda = ejecutarSecuencia(tablero, estado(0, 0, "SUR"), { fila: 5, columna: 5 }, secuencia);
    expect(segunda).toEqual(primera);
  });

  it("no muta el estado inicial recibido", () => {
    const inicio = estado(0, 0, "ESTE");
    ejecutarSecuencia(LIBRE, inicio, { fila: 5, columna: 5 }, ["AVANZAR", "AVANZAR"]);
    expect(inicio).toEqual(estado(0, 0, "ESTE"));
  });
});

describe("expandirAvanzar", () => {
  it("convierte 'avanzá N' en N acciones AVANZAR", () => {
    expect(expandirAvanzar(3)).toEqual(["AVANZAR", "AVANZAR", "AVANZAR"]);
    expect(expandirAvanzar(1)).toEqual(["AVANZAR"]);
  });

  it("una cantidad no positiva no genera acciones", () => {
    expect(expandirAvanzar(0)).toEqual([]);
    expect(expandirAvanzar(-2)).toEqual([]);
  });

  // Manual del Robot, sección 16: "avanzá N" se ejecuta paso a paso para poder
  // frenar en el último casillero válido e informar cuántos movimientos se hicieron.
  it("avanzá N frena en el último casillero válido e informa cuántos pasos hizo", () => {
    const conMuro: Tablero = {
      filas: 6,
      columnas: 6,
      obstaculos: [{ fila: 0, columna: 3 }],
    };
    const r = ejecutarSecuencia(
      conMuro,
      estado(0, 0, "ESTE"),
      { fila: 5, columna: 5 },
      expandirAvanzar(5),
    );
    expect(r.accionesAplicadas).toBe(2);
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 2 });
    expect(r.motivo).toBe("OBSTACULO");
  });

  it("avanzá N con el camino libre ejecuta los N pasos", () => {
    const r = ejecutarSecuencia(
      LIBRE,
      estado(0, 0, "ESTE"),
      { fila: 5, columna: 5 },
      expandirAvanzar(4),
    );
    expect(r.accionesAplicadas).toBe(4);
    expect(r.estadoFinal.celda).toEqual({ fila: 0, columna: 4 });
  });
});
