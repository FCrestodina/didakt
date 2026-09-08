import { describe, expect, it } from "vitest";
import { ejecutarSecuencia } from "@/lib/stem/grid/motor";
import type { Tablero } from "@/lib/stem/grid/tipos";
import { interpretar } from "./interprete";
import { normalizar } from "./interprete";
import {
  MENSAJE_CAPTURA,
  MENSAJE_LISTO,
  MENSAJE_PROCESANDO,
  clasificacionParaRegistro,
  componerMensaje,
  mensajeFallaDeVoz,
  resultadoParaRegistro,
} from "./mensajes";

const LIBRE: Tablero = { filas: 5, columnas: 5, obstaculos: [] };
// Obstáculo en (4,3): saliendo de (4,0) hacia el este entran dos movimientos
// antes del bloqueo, que es lo que hace visible la ejecución paso a paso.
const CON_MURO: Tablero = { filas: 5, columnas: 5, obstaculos: [{ fila: 4, columna: 3 }] };

/** Ejecuta una frase desde (4,0) mirando al ESTE, con destino en (4,4). */
function correr(frase: string, tablero: Tablero = LIBRE) {
  const interpretacion = interpretar(frase);
  const resultado =
    interpretacion.tipo === "EJECUTABLE"
      ? ejecutarSecuencia(
          tablero,
          { celda: { fila: 4, columna: 0 }, orientacion: "ESTE" },
          { fila: 4, columna: 4 },
          interpretacion.acciones,
        )
      : null;
  return { interpretacion, resultado, mensaje: componerMensaje(frase, interpretacion, resultado) };
}

describe("componerMensaje · instrucción ejecutada", () => {
  it("muestra la transcripción y la acción aplicada", () => {
    const { mensaje } = correr("avanzá dos casilleros");
    expect(mensaje.titulo).toBe("Instrucción reconocida");
    expect(mensaje.transcripcion).toBe("Se reconoció: “avanzá dos casilleros”");
    expect(mensaje.detalle).toContain("avanzar 2 casilleros");
  });

  it("informa el destino alcanzado sin festejo personificado", () => {
    const { mensaje } = correr("avanzá cuatro");
    expect(mensaje.titulo).toBe("Destino alcanzado");
    expect(mensaje.tono).toBe("logro");
    expect(mensaje.detalle).not.toContain("!");
  });

  it("informa la ejecución detenida por DETENER", () => {
    const { mensaje } = correr("pará");
    expect(mensaje.titulo).toBe("Ejecución detenida");
  });
});

describe("componerMensaje · tipo D, movimiento bloqueado por el entorno", () => {
  // La acción se reconoce como válida: lo que falla es el entorno, no la frase.
  it("un obstáculo se informa como bloqueo, no como error de la instrucción", () => {
    const { mensaje } = correr("avanzá cuatro", CON_MURO);
    expect(mensaje.titulo).toBe("Movimiento bloqueado");
    expect(mensaje.detalle).toContain("La acción fue reconocida");
    expect(mensaje.detalle).toContain("obstáculo");
  });

  it("informa cuántos movimientos se ejecutaron antes del bloqueo", () => {
    const { mensaje } = correr("avanzá cuatro", CON_MURO);
    expect(mensaje.detalle).toContain("Se ejecutaron 2 de 4 movimientos");
  });

  it("el límite del tablero se informa distinto del obstáculo", () => {
    const interpretacion = interpretar("avanzá");
    const resultado = ejecutarSecuencia(
      LIBRE,
      { celda: { fila: 4, columna: 0 }, orientacion: "SUR" },
      { fila: 0, columna: 4 },
      interpretacion.tipo === "EJECUTABLE" ? interpretacion.acciones : [],
    );
    const mensaje = componerMensaje("avanzá", interpretacion, resultado);
    expect(mensaje.detalle).toContain("sale del recorrido");
    expect(mensaje.detalle).not.toContain("obstáculo");
  });
});

describe("componerMensaje · las cuatro categorías dan títulos distintos", () => {
  it("cada tipo de falla se distingue del resto", () => {
    const titulos = new Set([
      componerMensaje("", interpretar(""), null).titulo,
      correr("andá para allá").mensaje.titulo,
      correr("ponete cerca de la puerta").mensaje.titulo,
      correr("avanzá cuatro", CON_MURO).mensaje.titulo,
    ]);
    expect(titulos.size).toBe(4);
  });

  it("la falla de reconocimiento no juzga la instrucción del estudiante", () => {
    const mensaje = mensajeFallaDeVoz("SIN_AUDIO");
    expect(mensaje.detalle).toContain("No se pudo reconocer lo dicho");
    expect(mensaje.transcripcion).toBeNull();
  });
});

describe("resultadoParaRegistro", () => {
  it("no dice 'movimientos' cuando se pidió un solo casillero", () => {
    const { interpretacion, resultado } = correr("girá a la derecha");
    expect(resultadoParaRegistro(interpretacion, resultado)).toBe("Acción ejecutada");
  });

  it("cuenta los movimientos ejecutados sobre los pedidos", () => {
    const { interpretacion, resultado } = correr("avanzá cuatro", CON_MURO);
    expect(resultadoParaRegistro(interpretacion, resultado)).toBe(
      "Se ejecutaron 2 de 4 movimientos",
    );
  });

  it("una instrucción no ejecutable queda como sin movimiento", () => {
    const { interpretacion, resultado } = correr("dale");
    expect(resultadoParaRegistro(interpretacion, resultado)).toBe("Sin movimiento");
  });
});

describe("clasificacionParaRegistro", () => {
  it("nombra las cuatro categorías del manual", () => {
    expect(clasificacionParaRegistro(interpretar("avanzá"))).toBe("Ejecutable");
    expect(clasificacionParaRegistro(interpretar("andá para allá"))).toBe(
      "Información insuficiente",
    );
    expect(clasificacionParaRegistro(interpretar("ponete cerca de la puerta"))).toBe(
      "Acción fuera del repertorio",
    );
    expect(clasificacionParaRegistro(interpretar(""))).toBe("Falla de reconocimiento");
  });
});

describe("desantropomorfización de toda la interfaz", () => {
  // Columna "Evitar" de la sección 9 del manual.
  const PROHIBIDAS = [
    "te estoy escuchando",
    "estoy pensando",
    "entendi",
    "te entendi",
    "no entendi",
    "me confundi",
    "no se hacer",
    "no sabe",
    "no quiero",
    "tengo miedo",
    "lo logre",
    "estoy feliz",
    "pense",
    "se acuerda",
    "decidio",
    "quiso",
  ];

  it("ningún mensaje del sistema atribuye comprensión, voluntad ni emociones", () => {
    const frases = [
      "avanzá",
      "avanzá cuatro",
      "girá a la derecha",
      "pará",
      "andá para allá",
      "un poquito más",
      "doblá acá",
      "ponete cerca de la puerta",
      "llevá el sobre a la biblioteca",
      "dale",
      "retrocedé",
      "avanzá diez",
      "",
    ];

    const mensajes = [
      MENSAJE_LISTO,
      MENSAJE_CAPTURA,
      MENSAJE_PROCESANDO,
      mensajeFallaDeVoz("SIN_SOPORTE"),
      mensajeFallaDeVoz("PERMISO_DENEGADO"),
      mensajeFallaDeVoz("SIN_AUDIO"),
      mensajeFallaDeVoz("CONFIANZA_BAJA"),
      mensajeFallaDeVoz("ERROR_TECNICO"),
      ...frases.map((f) => correr(f).mensaje),
      ...frases.map((f) => correr(f, CON_MURO).mensaje),
    ];

    for (const mensaje of mensajes) {
      const texto = normalizar(`${mensaje.titulo} ${mensaje.detalle} ${mensaje.etiquetaTono}`);
      for (const prohibida of PROHIBIDAS) {
        expect(texto, texto).not.toContain(normalizar(prohibida));
      }
    }
  });

  it("los estados de interfaz usan el vocabulario técnico del manual", () => {
    expect(MENSAJE_CAPTURA.titulo).toBe("Micrófono activo");
    expect(MENSAJE_PROCESANDO.titulo).toBe("Procesando audio…");
    expect(MENSAJE_LISTO.detalle).toBe("Presioná el micrófono para dar una instrucción.");
  });
});
