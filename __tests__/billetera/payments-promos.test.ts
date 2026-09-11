import { describe, it, expect } from "vitest";
import { calcularPago, leerOpciones } from "@/lib/billetera/payments";
import { parseQR } from "@/lib/billetera/qr";
import { CASOS } from "@/lib/billetera/kit";
import type { QRData } from "@/types/billetera";

// Los números de las consignas, calculados con los QR reales del kit.
function kit(id: string): QRData {
  const qr = CASOS.flatMap((c) => c.qrs).find((q) => q.id === id);
  if (!qr) throw new Error(`No existe el QR ${id} en el kit`);
  const leido = parseQR(qr.texto);
  if (!leido.ok) throw new Error(`QR del kit inválido: ${id}`);
  return leido.data;
}

describe("Caso 1: colectivo con 100 % de reintegro y tope de $8.000", () => {
  const colectivo = kit("colectivo");

  it("el reintegro queda pendiente y no entra al saldo", () => {
    const r = calcularPago(colectivo, 40000);
    expect(r.reintegro).toBe(837);
    expect(r.pendiente).toBe(true);
    expect(r.balanceAfter).toBe(40000 - 837);
  });

  it("40 viajes seguidos: devuelve 9 enteros, $467 en el décimo y nada después", () => {
    let acumulado = 0;
    let saldo = 33480;
    const reintegros: number[] = [];
    for (let i = 0; i < 40; i++) {
      const r = calcularPago(colectivo, saldo, { acumulado });
      reintegros.push(r.reintegro);
      acumulado += r.reintegro;
      saldo = r.balanceAfter;
    }
    expect(reintegros.slice(0, 9)).toEqual(Array(9).fill(837));
    expect(reintegros[9]).toBe(467);
    expect(reintegros.slice(10).every((x) => x === 0)).toBe(true);
    expect(acumulado).toBe(8000);
    // Gastó los $33.480 del mes; los $8.000 todavía no se acreditaron.
    expect(saldo).toBe(0);
  });

  it("con el tope agotado explica por qué no devuelve", () => {
    const r = calcularPago(colectivo, 10000, { acumulado: 8000 });
    expect(r.reintegro).toBe(0);
    expect(r.pendiente).toBe(false);
    expect(r.motivoSinBeneficio).toMatch(/tope/);
    expect(r.topeRestante).toBe(0);
  });
});

describe("Caso 2: supermercados con monto libre", () => {
  const verde = kit("supermercado-verde");
  const azul = kit("mercado-azul");

  it("Verde con $200.000: el 20 % serían $40.000, pero el tope lo corta en $25.000", () => {
    const r = calcularPago(verde, 300000, { monto: 200000 });
    expect(r.precioBase).toBe(200000);
    expect(r.total).toBe(200000);
    expect(r.reintegro).toBe(25000);
  });

  it("Verde con $50.000 no llega al mínimo", () => {
    const r = calcularPago(verde, 300000, { monto: 50000 });
    expect(r.reintegro).toBe(0);
    expect(r.motivoSinBeneficio).toMatch(/mínimo/);
  });

  it("Azul un viernes con $200.000 devuelve $30.000 (no tiene tope)", () => {
    expect(calcularPago(azul, 300000, { monto: 200000, dia: "V" }).reintegro).toBe(30000);
  });

  it("Azul un martes no aplica y dice por qué", () => {
    const r = calcularPago(azul, 300000, { monto: 200000, dia: "M" });
    expect(r.reintegro).toBe(0);
    expect(r.motivoSinBeneficio).toBe("Esta promo es solo los viernes.");
  });

  it("Azul sin día elegido todavía no muestra motivo (el modal lo está pidiendo)", () => {
    const r = calcularPago(azul, 300000, { monto: 200000 });
    expect(r.reintegro).toBe(0);
    expect(r.motivoSinBeneficio).toBeUndefined();
  });

  it("Azul con la compra semanal de $50.000 un viernes: $7.500", () => {
    expect(calcularPago(azul, 300000, { monto: 50000, dia: "V" }).reintegro).toBe(7500);
  });
});

describe("Caso 3: promos por cantidad", () => {
  const total = (id: string, cantidad: number) => calcularPago(kit(id), 100000, { cantidad }).total;

  it("2x1 vs 50 % por unidad (gaseosa $3.000)", () => {
    expect(total("gaseosa-2x1", 1)).toBe(3000);
    expect(total("gaseosa-2x1", 2)).toBe(3000);
    expect(total("gaseosa-2x1", 3)).toBe(6000);
    expect(total("gaseosa-50", 1)).toBe(1500);
    expect(total("gaseosa-50", 2)).toBe(3000);
    expect(total("gaseosa-50", 3)).toBe(4500);
  });

  it("3x2 vs 2x1 (leche $1.800, 6 unidades)", () => {
    expect(total("leche-3x2", 6)).toBe(7200);
    expect(total("leche-2x1", 6)).toBe(5400);
  });

  it("25 % por unidad vs 50 % en la 2.ª (papas $2.500)", () => {
    expect(total("papas-25", 2)).toBe(3750);
    expect(total("papas-segunda-50", 2)).toBe(3750);
    expect(total("papas-25", 3)).toBe(5625);
    expect(total("papas-segunda-50", 3)).toBe(6250);
  });

  it("25 % por unidad vs 70 % en la 2.ª (papel $4.000)", () => {
    expect(total("papel-25", 2)).toBe(6000);
    expect(total("papel-segunda-70", 2)).toBe(5200);
    expect(total("papel-25", 3)).toBe(9000);
    expect(total("papel-segunda-70", 3)).toBe(9200);
  });

  it("con 1 unidad, el 2x1 y la 2.ª unidad avisan por qué no se aplican", () => {
    expect(calcularPago(kit("gaseosa-2x1"), 10000, { cantidad: 1 }).motivoSinBeneficio).toMatch(/llevar 2/);
    expect(calcularPago(kit("papas-segunda-50"), 10000, { cantidad: 1 }).motivoSinBeneficio).toMatch(
      /2\.ª unidad/
    );
  });
});

describe("calcularPago: casos borde", () => {
  const base: QRData = {
    comercio: "Test",
    producto: "Item",
    precio: 1000,
    promo: 0,
    modo: "porcentaje",
    tipo: "normal",
  };

  it("un QR viejo sin opciones se comporta como antes (1 unidad, sin pendiente)", () => {
    const r = calcularPago({ ...base, tipo: "descuento", promo: 20 }, 5000);
    expect(r.cantidad).toBe(1);
    expect(r.total).toBe(800);
    expect(r.pendiente).toBe(false);
  });

  it("un descuento de más del 100 % no deja el total en negativo", () => {
    expect(calcularPago({ ...base, tipo: "descuento", promo: 150 }, 5000).total).toBe(0);
  });

  it("el descuento por monto fijo es por unidad", () => {
    const r = calcularPago({ ...base, tipo: "descuento", modo: "monto", promo: 300 }, 5000, { cantidad: 3 });
    expect(r.descuento).toBe(900);
    expect(r.total).toBe(2100);
  });

  it("el reintegro instantáneo sigue entrando al saldo en el momento", () => {
    const r = calcularPago({ ...base, tipo: "reintegro", promo: 10 }, 5000);
    expect(r.pendiente).toBe(false);
    expect(r.balanceAfter).toBe(4100);
  });

  it("el tope en pesos también corta un descuento", () => {
    const r = calcularPago({ ...base, tipo: "descuento", promo: 50, topePesos: 700 }, 5000, {
      cantidad: 2,
      acumulado: 500,
    });
    expect(r.descuento).toBe(200);
    expect(r.total).toBe(1800);
  });
});

describe("leerOpciones", () => {
  const verde = kit("supermercado-verde");
  const azul = kit("mercado-azul");
  const gaseosa = kit("gaseosa-2x1");

  it("monto libre sin monto → error", () => {
    expect(leerOpciones(verde, {}).ok).toBe(false);
  });

  it("monto libre con monto → ok", () => {
    const r = leerOpciones(verde, { monto: 200000 });
    expect(r.ok && r.opciones.monto).toBe(200000);
  });

  it("monto con decimales o negativo → error", () => {
    expect(leerOpciones(verde, { monto: 10.5 }).ok).toBe(false);
    expect(leerOpciones(verde, { monto: -5 }).ok).toBe(false);
  });

  it("un QR con días exige elegir el día", () => {
    expect(leerOpciones(azul, { monto: 1000 }).ok).toBe(false);
    const r = leerOpciones(azul, { monto: 1000, dia: "v" });
    expect(r.ok && r.opciones.dia).toBe("V");
  });

  it("cantidad fuera de rango → error; sin cantidad → ok", () => {
    expect(leerOpciones(gaseosa, { cantidad: 0 }).ok).toBe(false);
    expect(leerOpciones(gaseosa, { cantidad: 100 }).ok).toBe(false);
    expect(leerOpciones(gaseosa, {}).ok).toBe(true);
  });
});
