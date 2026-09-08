import { describe, expect, it } from "vitest";
import { extraerCantidad, interpretar, normalizar } from "./interprete";

/** Atajo para los tests: qué acción canónica salió, o el motivo del rechazo. */
function clasificar(frase: string): string {
  const r = interpretar(frase);
  switch (r.tipo) {
    case "EJECUTABLE":
      return r.canonica;
    case "SIN_TRANSCRIPCION":
      return "SIN_TRANSCRIPCION";
    default:
      return r.motivo;
  }
}

describe("normalizar", () => {
  // RF-04: tildes, mayúsculas y signos no deben impedir el reconocimiento.
  it("saca tildes, mayúsculas y signos de puntuación", () => {
    expect(normalizar("¡Girá, a la DERECHA!")).toBe("gira a la derecha");
    expect(normalizar("Avanzá.")).toBe("avanza");
  });

  it("trata gira, girá y GIRA como la misma palabra", () => {
    expect(normalizar("gira")).toBe(normalizar("girá"));
    expect(normalizar("GIRA")).toBe(normalizar("girá"));
  });

  it("colapsa los espacios repetidos", () => {
    expect(normalizar("  avanzá    dos   ")).toBe("avanza dos");
  });

  it("no confunde derecho con derecha", () => {
    expect(normalizar("seguí derecho")).toBe("segui derecho");
    expect(normalizar("seguí derecho")).not.toBe(normalizar("seguí a la derecha"));
  });
});

describe("extraerCantidad", () => {
  it("lee cantidades en dígitos y en palabras", () => {
    expect(extraerCantidad("avanza 3 casilleros")).toBe(3);
    expect(extraerCantidad("avanza tres casilleros")).toBe(3);
    expect(extraerCantidad("avanza un casillero")).toBe(1);
  });

  it("devuelve null cuando la frase no trae ninguna cantidad", () => {
    expect(extraerCantidad("avanza")).toBeNull();
  });

  // Un giro de 90 grados no es una cantidad de casilleros.
  it("no toma los grados de un giro como cantidad de casilleros", () => {
    expect(extraerCantidad("gira 90 grados a tu derecha")).toBeNull();
    expect(extraerCantidad("hace un giro de 90 grados a la izquierda")).toBeNull();
  });
});

describe("expresiones equivalentes que deben converger", () => {
  // Criterio de aceptación del manual: las cuatro formas producen el mismo giro.
  it("las cuatro formas de pedir un giro a la derecha dan la misma acción", () => {
    const frases = [
      "girá a la derecha",
      "doblá a la derecha",
      "da vuelta a la derecha",
      "girá 90 grados a tu derecha",
    ];
    for (const frase of frases) {
      expect(clasificar(frase), frase).toBe("GIRO_DERECHA_90");
    }
  });

  it("las formas de pedir un giro a la izquierda dan la misma acción", () => {
    const frases = [
      "girá a la izquierda",
      "dobla a la izquierda",
      "da vuelta hacia tu izquierda",
      "hacé un giro de 90 grados a la izquierda",
      "rotá hacia la izquierda",
    ];
    for (const frase of frases) {
      expect(clasificar(frase), frase).toBe("GIRO_IZQUIERDA_90");
    }
  });

  it("las formas del comando simple de avance dan avanzar 1 casillero", () => {
    const frases = [
      "avanzá",
      "seguí",
      "andá hacia adelante",
      "movete hacia adelante",
      "avanzá un casillero",
      "seguí derecho",
      "ve",
      "para adelante",
    ];
    for (const frase of frases) {
      const r = interpretar(frase);
      expect(r.tipo, frase).toBe("EJECUTABLE");
      if (r.tipo === "EJECUTABLE") {
        expect(r.canonica, frase).toBe("AVANZAR_1");
        expect(r.acciones, frase).toEqual(["AVANZAR"]);
      }
    }
  });

  it("las formas con cantidad dan avanzar N", () => {
    const casos: Array<[string, number]> = [
      ["avanzá dos", 2],
      ["seguí dos casilleros", 2],
      ["movete 3 casillas hacia adelante", 3],
      ["andá hacia adelante dos casilleros", 2],
      ["avanzá cinco", 5],
    ];
    for (const [frase, cantidad] of casos) {
      const r = interpretar(frase);
      expect(r.tipo, frase).toBe("EJECUTABLE");
      if (r.tipo === "EJECUTABLE") {
        expect(r.canonica, frase).toBe("AVANZAR_N");
        expect(r.cantidad, frase).toBe(cantidad);
        expect(r.acciones, frase).toHaveLength(cantidad);
      }
    }
  });

  it("las formas de pedir que se detenga dan la misma acción", () => {
    const frases = ["pará", "detenete", "frená", "quedate ahí", "parar", "quieto"];
    for (const frase of frases) {
      expect(clasificar(frase), frase).toBe("DETENER");
    }
  });
});

describe("matriz pedagógica · entradas que no deben ejecutarse", () => {
  it("una dirección deíctica no produce movimiento", () => {
    const r = interpretar("andá para allá");
    expect(r.tipo).toBe("INFORMACION_INSUFICIENTE");
    if (r.tipo === "INFORMACION_INSUFICIENTE") {
      expect(r.motivo).toBe("DIRECCION_DEICTICA");
      expect(r.detalle).toContain("dirección");
    }
  });

  it("una frase sin acción ni distancia utilizable no produce movimiento", () => {
    const r = interpretar("un poquito más");
    expect(r.tipo).toBe("INFORMACION_INSUFICIENTE");
    if (r.tipo === "INFORMACION_INSUFICIENTE") {
      expect(r.motivo).toBe("SIN_ACCION_NI_DISTANCIA");
    }
  });

  // El sistema recibió la frase, no el señalamiento: no se interpreta el gesto.
  it("un giro apoyado en un señalamiento no se resuelve por el gesto", () => {
    const r = interpretar("doblá acá");
    expect(r.tipo).toBe("INFORMACION_INSUFICIENTE");
    if (r.tipo === "INFORMACION_INSUFICIENTE") {
      expect(r.motivo).toBe("SENALAMIENTO");
      expect(r.detalle).toContain("señalamiento");
    }
  });

  it("una acción que no está en el repertorio se informa como tal", () => {
    const r = interpretar("ponete cerca de la puerta");
    expect(r.tipo).toBe("FUERA_DEL_REPERTORIO");
    if (r.tipo === "FUERA_DEL_REPERTORIO") {
      expect(r.detalle).toBe("Esta acción no está prevista en este sistema.");
    }
  });

  it("enunciar la meta de la misión no es un comando de movimiento", () => {
    const r = interpretar("llevá el sobre a la biblioteca");
    expect(r.tipo).toBe("INFORMACION_INSUFICIENTE");
    if (r.tipo === "INFORMACION_INSUFICIENTE") {
      expect(r.motivo).toBe("OBJETIVO_SIN_MOVIMIENTO");
      expect(r.detalle).toContain("meta");
    }
  });

  it("una interjección sin información no produce movimiento", () => {
    const r = interpretar("dale");
    expect(r.tipo).toBe("INFORMACION_INSUFICIENTE");
    if (r.tipo === "INFORMACION_INSUFICIENTE") {
      expect(r.motivo).toBe("SIN_INFORMACION");
      expect(r.detalle).toBe("Falta información para realizar una acción.");
    }
  });

  it("un giro sin lado indicado pide el lado", () => {
    expect(clasificar("girá")).toBe("GIRO_SIN_DIRECCION");
    expect(clasificar("doblá")).toBe("GIRO_SIN_DIRECCION");
  });

  it("una dirección sola, sin acción, no alcanza", () => {
    expect(clasificar("a la derecha")).toBe("FALTA_ACCION");
    expect(clasificar("izquierda")).toBe("FALTA_ACCION");
  });

  it("una cantidad sola, sin acción, no alcanza", () => {
    expect(clasificar("tres casilleros")).toBe("FALTA_ACCION");
  });

  it("mezclar avanzar con una dirección de giro no se resuelve por inferencia", () => {
    expect(clasificar("andá a la derecha")).toBe("MOVIMIENTO_CON_DIRECCION_DE_GIRO");
  });

  it("dos acciones en una misma instrucción no se parten automáticamente", () => {
    expect(clasificar("girá a la derecha y avanzá")).toBe("MAS_DE_UNA_ACCION");
  });

  it("indicar los dos lados a la vez no define un giro", () => {
    expect(clasificar("girá a la derecha o a la izquierda")).toBe("GIRO_SIN_DIRECCION");
  });
});

describe("decisiones cerradas de la sección 20 del manual", () => {
  it("retroceder no está en el repertorio de la primera versión", () => {
    for (const frase of ["retrocedé", "andá para atrás", "vení para atrás", "marcha atrás"]) {
      const r = interpretar(frase);
      expect(r.tipo, frase).toBe("FUERA_DEL_REPERTORIO");
    }
  });

  it("media vuelta no está en el repertorio de la primera versión", () => {
    for (const frase of ["hacé media vuelta", "girá 180 grados"]) {
      const r = interpretar(frase);
      expect(r.tipo, frase).toBe("FUERA_DEL_REPERTORIO");
    }
  });

  it("acepta de 1 a 5 casilleros e informa cuando se pide más", () => {
    for (let n = 1; n <= 5; n++) {
      expect(interpretar(`avanzá ${n}`).tipo, `avanzá ${n}`).toBe("EJECUTABLE");
    }
    const r = interpretar("avanzá seis casilleros");
    expect(r.tipo).toBe("FUERA_DEL_REPERTORIO");
    if (r.tipo === "FUERA_DEL_REPERTORIO") {
      expect(r.motivo).toBe("CANTIDAD_FUERA_DE_RANGO");
      expect(r.detalle).toContain("1 y 5");
    }
  });

  it("una cantidad grande en dígitos tampoco se recorta en silencio", () => {
    expect(clasificar("avanzá 20 casilleros")).toBe("CANTIDAD_FUERA_DE_RANGO");
  });
});

describe("falla de reconocimiento", () => {
  it("una transcripción vacía es una falla técnica, no un error de la instrucción", () => {
    const r = interpretar("");
    expect(r.tipo).toBe("SIN_TRANSCRIPCION");
    if (r.tipo === "SIN_TRANSCRIPCION") {
      expect(r.detalle).toContain("No se pudo reconocer");
    }
  });

  it("solo signos o espacios se tratan igual que el silencio", () => {
    expect(clasificar("   ")).toBe("SIN_TRANSCRIPCION");
    expect(clasificar("¿¿??")).toBe("SIN_TRANSCRIPCION");
  });
});

describe("casos de prueba mínimos del manual (sección 15.1)", () => {
  const casos: Array<{ id: string; entrada: string; esperado: string }> = [
    { id: "CP-01", entrada: "avanzá", esperado: "AVANZAR_1" },
    { id: "CP-02", entrada: "seguí derecho", esperado: "AVANZAR_1" },
    { id: "CP-03", entrada: "avanzá tres casillas", esperado: "AVANZAR_N" },
    { id: "CP-04", entrada: "da vuelta a la derecha", esperado: "GIRO_DERECHA_90" },
    { id: "CP-05", entrada: "girá 90 grados a tu derecha", esperado: "GIRO_DERECHA_90" },
    { id: "CP-06", entrada: "andá para allá", esperado: "DIRECCION_DEICTICA" },
    { id: "CP-07", entrada: "un poquito más", esperado: "SIN_ACCION_NI_DISTANCIA" },
    { id: "CP-08", entrada: "llevá el sobre a la biblioteca", esperado: "OBJETIVO_SIN_MOVIMIENTO" },
    { id: "CP-09", entrada: "", esperado: "SIN_TRANSCRIPCION" },
    { id: "CP-10", entrada: "doblá a la izquierda", esperado: "GIRO_IZQUIERDA_90" },
  ];

  for (const caso of casos) {
    it(`${caso.id} · "${caso.entrada}"`, () => {
      expect(clasificar(caso.entrada)).toBe(caso.esperado);
    });
  }
});

describe("la entrada escrita produce el mismo resultado que la voz transcripta", () => {
  // Criterio de aceptación: el mismo módulo de interpretación para las dos vías.
  it("misma frase dictada o escrita, mismo resultado semántico", () => {
    const frases = [
      "doblá a la izquierda",
      "avanzá dos casilleros",
      "andá para allá",
      "pará",
      "ponete cerca de la puerta",
    ];
    for (const frase of frases) {
      // La voz llega con mayúsculas y puntuación del motor de transcripción;
      // el texto escrito llega tal cual lo tipeó el estudiante.
      const comoVoz = interpretar(`${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`);
      const comoTexto = interpretar(frase);
      expect(comoVoz, frase).toEqual(comoTexto);
    }
  });
});

describe("descripciones para el panel de estado", () => {
  it("describe la acción aplicada sin atribuir procesos humanos", () => {
    const avance = interpretar("avanzá dos");
    const giro = interpretar("girá a la derecha");
    expect(avance.tipo === "EJECUTABLE" && avance.descripcion).toBe("avanzar 2 casilleros");
    expect(giro.tipo === "EJECUTABLE" && giro.descripcion).toBe("giro de 90° a la derecha");
  });

  it("ningún mensaje del intérprete atribuye comprensión o emociones", () => {
    // Columna "Evitar" de la sección 9 del manual, ya normalizada.
    const prohibidas = [
      "entendi",
      "entendio",
      "te entendi",
      "no se hacer",
      "no sabe",
      "me confundi",
      "estoy pensando",
      "te estoy escuchando",
      "pense",
      "no quiero",
      "tengo miedo",
      "feliz",
      "lo logre",
    ];
    const frases = [
      "avanzá",
      "girá",
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
    for (const frase of frases) {
      const r = interpretar(frase);
      const mensaje = normalizar(
        r.tipo === "EJECUTABLE" ? r.descripcion : r.detalle,
      );
      for (const prohibida of prohibidas) {
        expect(mensaje, `"${frase}" -> "${mensaje}"`).not.toContain(prohibida);
      }
    }
  });
});
