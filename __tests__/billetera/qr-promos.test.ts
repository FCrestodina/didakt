import { describe, it, expect } from "vitest";
import {
  parseQR,
  buildQRText,
  formDesdeQR,
  calcularPromoKey,
  grupoPromo,
  type QRFormFields,
} from "@/lib/billetera/qr";
import { CASOS } from "@/lib/billetera/kit";

describe("parseQR: campos nuevos", () => {
  it("un QR viejo se lee exactamente igual que antes", () => {
    const r = parseQR(
      "comercio=Kiosco\nproducto=Alfajor\nprecio=1000\npromo=10\nmodo=porcentaje\ntipo=descuento\ntope=2"
    );
    expect(r.ok && r.data).toStrictEqual({
      comercio: "Kiosco",
      producto: "Alfajor",
      precio: 1000,
      promo: 10,
      modo: "porcentaje",
      tipo: "descuento",
      tope: 2,
    });
  });

  it("precio=libre", () => {
    const r = parseQR("comercio=Súper\nprecio=libre\npromo=20\ntipo=reintegro");
    expect(r.ok && r.data.precioLibre).toBe(true);
    expect(r.ok && r.data.precio).toBe(0);
  });

  it("nxm con lleva y paga", () => {
    const r = parseQR("precio=3000\ntipo=nxm\nlleva=3\npaga=2");
    expect(r.ok && [r.data.tipo, r.data.lleva, r.data.paga]).toEqual(["nxm", 3, 2]);
  });

  it("nxm inválido → error", () => {
    expect(parseQR("precio=100\ntipo=nxm\nlleva=2\npaga=2").ok).toBe(false);
    expect(parseQR("precio=100\ntipo=nxm").ok).toBe(false);
  });

  it("una promo por unidad con monto libre → error", () => {
    expect(parseQR("precio=libre\ntipo=segunda\npromo=50").ok).toBe(false);
    expect(parseQR("precio=libre\ntipo=nxm\nlleva=2\npaga=1").ok).toBe(false);
  });

  it("días con letras o con nombres", () => {
    const dias = (v: string) => {
      const r = parseQR(`precio=100\ntipo=descuento\npromo=10\ndias=${v}`);
      return r.ok ? r.data.dias : "error";
    };
    expect(dias("V")).toEqual(["V"]);
    expect(dias("LMXJV")).toEqual(["L", "M", "X", "J", "V"]);
    expect(dias("viernes")).toEqual(["V"]);
    expect(dias("sáb, dom")).toEqual(["S", "D"]);
    expect(dias("miércoles")).toEqual(["X"]);
    expect(dias("cualquiera")).toBeUndefined();
  });

  it("condiciones y datos informativos", () => {
    const r = parseQR(
      [
        "precio=837",
        "promo=100",
        "tipo=reintegro",
        "acreditacion=pendiente",
        "plazo=3",
        "promocion=Transporte con QR",
        "tope_pesos=8000",
        "minimo=500",
        "modalidad=Pagando con QR",
        "vigencia=Hasta el 31/05/2026",
        "condiciones=Hasta agotar cupo",
      ].join("\n")
    );
    expect(r.ok && r.data).toMatchObject({
      acreditacion: "pendiente",
      plazo: 3,
      promocion: "Transporte con QR",
      topePesos: 8000,
      minimo: 500,
      modalidad: "Pagando con QR",
      vigencia: "Hasta el 31/05/2026",
      condiciones: "Hasta agotar cupo",
    });
  });

  it("un tope_pesos corrupto se ignora, igual que tope", () => {
    const r = parseQR("precio=100\ntipo=descuento\npromo=10\ntope_pesos=abc");
    expect(r.ok && r.data.topePesos).toBeUndefined();
  });
});

describe("buildQRText ↔ parseQR ↔ formDesdeQR", () => {
  const base: QRFormFields = {
    comercio: "Kiosco",
    producto: "Alfajor",
    precio: "1000",
    tipo: "normal",
    modo: "porcentaje",
    promo: "",
    tope: "",
  };

  it("todos los QR del kit se leen y se vuelven a armar idénticos", () => {
    const qrs = CASOS.flatMap((c) => c.qrs);
    expect(qrs.length).toBe(11);
    for (const q of qrs) {
      const r = parseQR(q.texto);
      expect(r.ok, q.id).toBe(true);
      if (r.ok) expect(buildQRText(formDesdeQR(r.data)), q.id).toBe(q.texto);
    }
  });

  it("un pago normal no escribe condiciones aunque el formulario las tenga", () => {
    const texto = buildQRText({ ...base, minimo: "5000", dias: ["V"], topePesos: "100" });
    expect(texto).toBe("comercio=Kiosco\nproducto=Alfajor\nprecio=1000");
  });

  it("un salto de línea en un campo no parte el QR", () => {
    const r = parseQR(buildQRText({ ...base, comercio: "Kiosco\nEscolar" }));
    expect(r.ok && r.data.comercio).toBe("Kiosco Escolar");
  });

  it("los días se escriben en orden de la semana", () => {
    expect(buildQRText({ ...base, tipo: "descuento", promo: "10", dias: ["V", "L"] })).toContain("dias=LV");
  });
});

describe("claves de promo", () => {
  it("calcularPromoKey no cambia para los QR que no son nxm (los contadores viejos siguen valiendo)", () => {
    const r = parseQR("comercio=K\nproducto=A\nprecio=1000\npromo=10\nmodo=porcentaje\ntipo=descuento");
    expect(r.ok && calcularPromoKey(r.data)).toBe("K|A|1000|10|porcentaje|descuento");
  });

  it("un 2x1 y un 3x2 del mismo producto no comparten clave", () => {
    const a = parseQR("comercio=K\nproducto=Leche\nprecio=1800\ntipo=nxm\nlleva=2\npaga=1");
    const b = parseQR("comercio=K\nproducto=Leche\nprecio=1800\ntipo=nxm\nlleva=3\npaga=2");
    expect(a.ok && b.ok && calcularPromoKey(a.data) !== calcularPromoKey(b.data)).toBe(true);
  });

  it("grupoPromo usa el nombre de la promoción, o comercio · producto", () => {
    const con = parseQR("comercio=Colectivo\nproducto=Pasaje\nprecio=837\npromocion=Transporte con QR");
    const sin = parseQR("comercio=Colectivo\nproducto=Pasaje\nprecio=837");
    expect(con.ok && grupoPromo(con.data)).toBe("Transporte con QR");
    expect(sin.ok && grupoPromo(sin.data)).toBe("Colectivo · Pasaje");
  });
});
