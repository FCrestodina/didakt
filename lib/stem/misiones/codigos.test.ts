import { describe, expect, it } from "vitest";
import {
  LARGO_CODIGO_CREACION,
  LARGO_CODIGO_JUEGO,
  esCodigoValido,
  formatearCodigo,
  generarCodigo,
  generarCodigoCreacion,
  generarCodigoJuego,
  normalizarCodigo,
} from "./codigos";

describe("generarCodigo", () => {
  it("genera códigos de la longitud pedida", () => {
    for (const largo of [4, 8, 10, 16]) {
      expect(generarCodigo(largo)).toHaveLength(largo);
    }
  });

  it("usa solo caracteres del alfabeto sin ambigüedades", () => {
    for (let i = 0; i < 200; i++) {
      expect(generarCodigo(12)).toMatch(/^[2-9A-HJKMNP-Z]+$/);
    }
  });

  it("no usa caracteres que se confunden al leerlos o copiarlos", () => {
    const muestra = Array.from({ length: 300 }, () => generarCodigo(12)).join("");
    for (const confuso of ["0", "O", "1", "I", "L"]) {
      expect(muestra, `apareció ${confuso}`).not.toContain(confuso);
    }
  });

  // Los códigos tienen que ser suficientemente difíciles de adivinar
  // (sección 2.1 del manual).
  it("no repite códigos en una muestra grande", () => {
    const muestra = new Set(Array.from({ length: 2000 }, () => generarCodigo(10)));
    expect(muestra.size).toBe(2000);
  });
});

describe("los dos códigos de una sala", () => {
  it("el código de creación y el de juego tienen longitudes propias", () => {
    expect(generarCodigoCreacion()).toHaveLength(LARGO_CODIGO_CREACION);
    expect(generarCodigoJuego()).toHaveLength(LARGO_CODIGO_JUEGO);
  });

  // Sección 10.2: los tokens de creación y juego deben ser diferentes, y tener
  // uno no puede permitir deducir el otro.
  it("nunca coinciden entre sí", () => {
    for (let i = 0; i < 200; i++) {
      expect(generarCodigoCreacion()).not.toBe(generarCodigoJuego());
    }
  });

  it("uno no es prefijo ni sufijo del otro", () => {
    for (let i = 0; i < 200; i++) {
      const creacion = generarCodigoCreacion();
      const juego = generarCodigoJuego();
      expect(creacion.startsWith(juego)).toBe(false);
      expect(creacion.endsWith(juego)).toBe(false);
    }
  });
});

describe("normalizarCodigo", () => {
  it("pasa a mayúsculas y saca espacios y guiones", () => {
    expect(normalizarCodigo("ab2d-4f6h")).toBe("AB2D4F6H");
    expect(normalizarCodigo("  AB2D 4F6H  ")).toBe("AB2D4F6H");
  });

  it("tolera el formato en bloques que muestra la pantalla", () => {
    const codigo = generarCodigoJuego();
    expect(normalizarCodigo(formatearCodigo(codigo))).toBe(codigo);
  });

  it("no rompe con una entrada vacía", () => {
    expect(normalizarCodigo("")).toBe("");
  });
});

describe("esCodigoValido", () => {
  it("acepta un código recién generado", () => {
    expect(esCodigoValido(generarCodigoJuego(), LARGO_CODIGO_JUEGO)).toBe(true);
    expect(esCodigoValido(generarCodigoCreacion(), LARGO_CODIGO_CREACION)).toBe(true);
  });

  it("acepta el código escrito con espacios", () => {
    const codigo = generarCodigoJuego();
    expect(esCodigoValido(formatearCodigo(codigo), LARGO_CODIGO_JUEGO)).toBe(true);
  });

  it("rechaza una longitud distinta", () => {
    expect(esCodigoValido("AB2D", LARGO_CODIGO_JUEGO)).toBe(false);
    expect(esCodigoValido(generarCodigoCreacion(), LARGO_CODIGO_JUEGO)).toBe(false);
  });

  it("rechaza caracteres fuera del alfabeto", () => {
    expect(esCodigoValido("ABCD1234", LARGO_CODIGO_JUEGO)).toBe(false);
    expect(esCodigoValido("ABCDOOOO", LARGO_CODIGO_JUEGO)).toBe(false);
  });
});

describe("formatearCodigo", () => {
  it("agrupa de a cuatro para que sea más fácil de leer", () => {
    expect(formatearCodigo("AB2D4F6H")).toBe("AB2D 4F6H");
    expect(formatearCodigo("AB2D4F6H9K")).toBe("AB2D 4F6H 9K");
  });
});
