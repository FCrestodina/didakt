import { describe, it, expect } from "vitest";
import { parseQR } from "@/lib/billetera/qr";

describe("parseQR", () => {
  it("parsea un QR válido mínimo", () => {
    const result = parseQR("precio=1200");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.precio).toBe(1200);
    expect(result.data.tipo).toBe("normal");
    expect(result.data.comercio).toBe("Comercio");
    expect(result.data.producto).toBe("Producto");
  });

  it("parsea todos los campos", () => {
    const raw = [
      "comercio=Kiosco Escolar",
      "producto=Alfajor",
      "precio=2500",
      "promo=20",
      "modo=porcentaje",
      "tipo=descuento",
      "tope=2",
    ].join("\n");
    const result = parseQR(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.comercio).toBe("Kiosco Escolar");
    expect(result.data.precio).toBe(2500);
    expect(result.data.promo).toBe(20);
    expect(result.data.modo).toBe("porcentaje");
    expect(result.data.tipo).toBe("descuento");
    expect(result.data.tope).toBe(2);
  });

  it("retorna error si falta precio", () => {
    const result = parseQR("comercio=Kiosco");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Falta el precio.");
  });

  it("retorna error si precio no es número", () => {
    const result = parseQR("precio=abc");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("El precio del QR no es válido.");
  });

  it("retorna error si tipo es inválido", () => {
    const result = parseQR("precio=100\ntipo=invalido");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("No se pudo leer la promoción.");
  });

  it("retorna error si modo es inválido", () => {
    const result = parseQR("precio=100\nmodo=invalido");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("No se pudo leer la promoción.");
  });

  it("parsea QR con saltos de línea Windows (CRLF)", () => {
    const result = parseQR("comercio=Test\r\nproducto=Prod\r\nprecio=500");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.precio).toBe(500);
  });
});
