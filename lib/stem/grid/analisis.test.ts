import { describe, expect, it } from "vitest";
import { admiteMisionNoTrivial, analizarMision, celdasLibres, llegaEnLineaRecta } from "./analisis";
import { ejecutarSecuencia } from "./motor";
import type { Estado, Tablero } from "./tipos";

const LIBRE: Tablero = { filas: 6, columnas: 6, obstaculos: [] };

function estado(fila: number, columna: number, orientacion: Estado["orientacion"]): Estado {
  return { celda: { fila, columna }, orientacion };
}

describe("llegaEnLineaRecta", () => {
  it("reconoce una meta alineada con la orientación inicial y sin obstáculos", () => {
    expect(llegaEnLineaRecta(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 4 })).toBe(true);
  });

  it("no llega si la meta está en otra fila", () => {
    expect(llegaEnLineaRecta(LIBRE, estado(0, 0, "ESTE"), { fila: 2, columna: 4 })).toBe(false);
  });

  it("un obstáculo intermedio corta la recta", () => {
    const conMuro: Tablero = { filas: 6, columnas: 6, obstaculos: [{ fila: 0, columna: 2 }] };
    expect(llegaEnLineaRecta(conMuro, estado(0, 0, "ESTE"), { fila: 0, columna: 4 })).toBe(false);
  });

  it("no llega si la meta está detrás del dispositivo", () => {
    expect(llegaEnLineaRecta(LIBRE, estado(0, 4, "ESTE"), { fila: 0, columna: 0 })).toBe(false);
  });
});

describe("analizarMision · alcanzabilidad", () => {
  it("una meta encerrada por obstáculos no es alcanzable", () => {
    const encerrada: Tablero = {
      filas: 5,
      columnas: 5,
      obstaculos: [
        { fila: 1, columna: 2 },
        { fila: 3, columna: 2 },
        { fila: 2, columna: 1 },
        { fila: 2, columna: 3 },
      ],
    };
    const analisis = analizarMision(encerrada, estado(0, 0, "SUR"), { fila: 2, columna: 2 });
    expect(analisis.alcanzable).toBe(false);
    expect(analisis.longitudMinima).toBeNull();
  });

  it("una salida sobre un obstáculo no es una configuración válida", () => {
    const conMuro: Tablero = { filas: 5, columnas: 5, obstaculos: [{ fila: 1, columna: 1 }] };
    expect(analizarMision(conMuro, estado(1, 1, "NORTE"), { fila: 4, columna: 4 }).alcanzable).toBe(
      false,
    );
  });

  it("una meta sobre un obstáculo no es una configuración válida", () => {
    const conMuro: Tablero = { filas: 5, columnas: 5, obstaculos: [{ fila: 1, columna: 1 }] };
    expect(analizarMision(conMuro, estado(0, 0, "SUR"), { fila: 1, columna: 1 }).alcanzable).toBe(
      false,
    );
  });
});

describe("analizarMision · solución mínima", () => {
  it("la solución mínima que devuelve realmente resuelve la misión", () => {
    const tablero: Tablero = {
      filas: 6,
      columnas: 6,
      obstaculos: [
        { fila: 1, columna: 1 },
        { fila: 2, columna: 3 },
        { fila: 4, columna: 2 },
      ],
    };
    const inicio = estado(0, 0, "SUR");
    const meta = { fila: 5, columna: 5 };

    const analisis = analizarMision(tablero, inicio, meta);
    expect(analisis.alcanzable).toBe(true);
    expect(analisis.solucionMinima).not.toBeNull();

    const resultado = ejecutarSecuencia(tablero, inicio, meta, analisis.solucionMinima!);
    expect(resultado.exito).toBe(true);
    expect(resultado.pasos).toHaveLength(analisis.longitudMinima!);
  });

  it("cuenta la longitud mínima incluyendo los giros", () => {
    // De (0,0) mirando al ESTE hasta (1,1): avanzar, girar, avanzar = 3 acciones.
    const analisis = analizarMision(LIBRE, estado(0, 0, "ESTE"), { fila: 1, columna: 1 });
    expect(analisis.longitudMinima).toBe(3);
  });

  it("una meta a un casillero de distancia y de frente cuesta una sola acción", () => {
    const analisis = analizarMision(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 1 });
    expect(analisis.longitudMinima).toBe(1);
  });
});

describe("analizarMision · misiones triviales", () => {
  it("marca como trivial una meta en línea recta", () => {
    const analisis = analizarMision(LIBRE, estado(0, 0, "ESTE"), { fila: 0, columna: 5 });
    expect(analisis.hayRectaSinGiros).toBe(true);
    expect(analisis.trivial).toBe(true);
  });

  it("marca como trivial una meta que se alcanza con una sola acción", () => {
    expect(analizarMision(LIBRE, estado(3, 3, "NORTE"), { fila: 2, columna: 3 }).trivial).toBe(true);
  });

  it("no marca como trivial una misión que exige al menos un giro", () => {
    const analisis = analizarMision(LIBRE, estado(0, 0, "ESTE"), { fila: 3, columna: 3 });
    expect(analisis.hayRectaSinGiros).toBe(false);
    expect(analisis.trivial).toBe(false);
  });

  it("un obstáculo puede volver no trivial una meta que estaba en línea recta", () => {
    const conMuro: Tablero = { filas: 6, columnas: 6, obstaculos: [{ fila: 0, columna: 3 }] };
    const analisis = analizarMision(conMuro, estado(0, 0, "ESTE"), { fila: 0, columna: 5 });
    expect(analisis.alcanzable).toBe(true);
    expect(analisis.hayRectaSinGiros).toBe(false);
    expect(analisis.trivial).toBe(false);
  });
});

describe("analizarMision · más de un recorrido válido", () => {
  // Manual del Creador de misiones, sección 4.2: al menos dos tableros deben
  // permitir más de un recorrido válido, para favorecer la comparación.
  it("cuenta más de una solución mínima cuando un obstáculo se puede rodear por dos lados", () => {
    // El obstáculo está justo en el medio del camino recto: rodearlo por arriba
    // y rodearlo por abajo cuestan exactamente lo mismo.
    const conIsla: Tablero = { filas: 5, columnas: 5, obstaculos: [{ fila: 2, columna: 2 }] };
    const analisis = analizarMision(conIsla, estado(2, 0, "ESTE"), { fila: 2, columna: 4 });
    expect(analisis.alcanzable).toBe(true);
    expect(analisis.solucionesMinimas).toBeGreaterThan(1);
  });

  it("una meta en diagonal tiene una sola ruta mínima, porque cada giro cuesta una acción", () => {
    // Avanzar sobre el eje al que ya se mira y girar una sola vez siempre gana
    // contra girar primero: la ruta mínima queda forzada.
    const analisis = analizarMision(LIBRE, estado(0, 0, "ESTE"), { fila: 2, columna: 2 });
    expect(analisis.longitudMinima).toBe(5);
    expect(analisis.solucionesMinimas).toBe(1);
  });

  it("cuenta una sola solución mínima cuando el recorrido está forzado", () => {
    // Pasillo de una sola fila: no hay alternativa posible.
    const pasillo: Tablero = {
      filas: 3,
      columnas: 4,
      obstaculos: [
        { fila: 0, columna: 0 },
        { fila: 0, columna: 1 },
        { fila: 0, columna: 2 },
        { fila: 0, columna: 3 },
        { fila: 2, columna: 0 },
        { fila: 2, columna: 1 },
        { fila: 2, columna: 2 },
        { fila: 2, columna: 3 },
      ],
    };
    const analisis = analizarMision(pasillo, estado(1, 0, "ESTE"), { fila: 1, columna: 3 });
    expect(analisis.longitudMinima).toBe(3);
    expect(analisis.solucionesMinimas).toBe(1);
  });
});

describe("celdasLibres y admiteMisionNoTrivial", () => {
  it("celdasLibres excluye los obstáculos", () => {
    const conMuro: Tablero = {
      filas: 3,
      columnas: 3,
      obstaculos: [
        { fila: 1, columna: 1 },
        { fila: 0, columna: 2 },
      ],
    };
    expect(celdasLibres(conMuro)).toHaveLength(7);
  });

  it("un tablero abierto admite misiones no triviales", () => {
    expect(admiteMisionNoTrivial(LIBRE)).toBe(true);
  });

  it("un tablero con una sola celda libre no admite ninguna misión", () => {
    // Sin un par salida/meta distinto no hay misión posible.
    const unaSola: Tablero = {
      filas: 2,
      columnas: 2,
      obstaculos: [
        { fila: 0, columna: 1 },
        { fila: 1, columna: 0 },
        { fila: 1, columna: 1 },
      ],
    };
    expect(admiteMisionNoTrivial(unaSola)).toBe(false);
  });

  it("en un tablero de una sola fila, mirar en sentido contrario a la meta ya exige giros", () => {
    // Es el caso que hace que un tablero plano no sea automáticamente trivial:
    // dar media vuelta cuesta dos acciones.
    const unaFila: Tablero = { filas: 1, columnas: 6, obstaculos: [] };
    const deEspaldas = analizarMision(unaFila, estado(0, 0, "OESTE"), { fila: 0, columna: 3 });
    expect(deEspaldas.hayRectaSinGiros).toBe(false);
    expect(deEspaldas.trivial).toBe(false);
    expect(deEspaldas.longitudMinima).toBe(5);

    const deFrente = analizarMision(unaFila, estado(0, 0, "ESTE"), { fila: 0, columna: 3 });
    expect(deFrente.trivial).toBe(true);
  });
});
