import { describe, it, expect } from "vitest";
import { calcularPago } from "@/lib/billetera/payments";
import type { QRData } from "@/types/billetera";

const base: QRData = {
  comercio: "Test",
  producto: "Item",
  precio: 1000,
  promo: 0,
  modo: "porcentaje",
  tipo: "normal",
};

describe("calcularPago", () => {
  it("pago normal sin promo", () => {
    const r = calcularPago({ ...base, precio: 1200 }, 5000);
    expect(r.total).toBe(1200);
    expect(r.descuento).toBe(0);
    expect(r.reintegro).toBe(0);
    expect(r.balanceAfter).toBe(3800);
  });

  it("descuento porcentual", () => {
    const r = calcularPago({ ...base, precio: 3000, promo: 20, modo: "porcentaje", tipo: "descuento" }, 10000);
    expect(r.descuento).toBe(600);
    expect(r.total).toBe(2400);
    expect(r.balanceAfter).toBe(7600);
  });

  it("descuento por monto fijo", () => {
    const r = calcularPago({ ...base, precio: 5000, promo: 1000, modo: "monto", tipo: "descuento" }, 10000);
    expect(r.descuento).toBe(1000);
    expect(r.total).toBe(4000);
    expect(r.balanceAfter).toBe(6000);
  });

  it("reintegro porcentual", () => {
    const r = calcularPago({ ...base, precio: 4000, promo: 25, modo: "porcentaje", tipo: "reintegro" }, 10000);
    expect(r.reintegro).toBe(1000);
    expect(r.total).toBe(4000);
    expect(r.balanceAfter).toBe(7000); // 10000 - 4000 + 1000
  });

  it("reintegro por monto fijo", () => {
    const r = calcularPago({ ...base, precio: 8000, promo: 1500, modo: "monto", tipo: "reintegro" }, 15000);
    expect(r.reintegro).toBe(1500);
    expect(r.total).toBe(8000);
    expect(r.balanceAfter).toBe(8500); // 15000 - 8000 + 1500
  });

  it("saldo insuficiente retorna balanceAfter negativo", () => {
    const r = calcularPago({ ...base, precio: 5000 }, 3000);
    expect(r.balanceAfter).toBe(-2000);
  });

  it("descuento no puede superar el precio (monto fijo)", () => {
    const r = calcularPago({ ...base, precio: 500, promo: 1000, modo: "monto", tipo: "descuento" }, 5000);
    expect(r.descuento).toBe(500);
    expect(r.total).toBe(0);
  });
});
