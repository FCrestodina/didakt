import { describe, it, expect } from "vitest";
import { buildQRText, parseQR, type QRFormFields } from "@/lib/billetera/qr";

const base: QRFormFields = {
  comercio: "Kiosco Escolar",
  producto: "Alfajor",
  precio: "2500",
  tipo: "normal",
  modo: "porcentaje",
  promo: "20",
  tope: "",
};

describe("buildQRText -> parseQR (round-trip)", () => {
  it("pago normal: no incluye promo/modo/tipo", () => {
    const text = buildQRText(base);
    expect(text).toBe("comercio=Kiosco Escolar\nproducto=Alfajor\nprecio=2500");
    const parsed = parseQR(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.precio).toBe(2500);
      expect(parsed.data.tipo).toBe("normal");
    }
  });

  it("descuento porcentual round-trip", () => {
    const parsed = parseQR(buildQRText({ ...base, tipo: "descuento", modo: "porcentaje", promo: "20" }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.tipo).toBe("descuento");
      expect(parsed.data.modo).toBe("porcentaje");
      expect(parsed.data.promo).toBe(20);
    }
  });

  it("reintegro por monto con tope round-trip", () => {
    const parsed = parseQR(
      buildQRText({ ...base, tipo: "reintegro", modo: "monto", promo: "1500", tope: "2" })
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.tipo).toBe("reintegro");
      expect(parsed.data.modo).toBe("monto");
      expect(parsed.data.promo).toBe(1500);
      expect(parsed.data.tope).toBe(2);
    }
  });

  it("omite comercio/producto vacíos pero mantiene precio", () => {
    const text = buildQRText({ ...base, comercio: "", producto: "" });
    expect(text).toBe("precio=2500");
    expect(parseQR(text).ok).toBe(true);
  });
});
