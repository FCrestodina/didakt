import type { QRData, PaymentResult } from "@/types/billetera";

export function calcularPago(data: QRData, balanceActual: number): PaymentResult {
  const { precio, promo, modo, tipo } = data;
  let descuento = 0;
  let reintegro = 0;
  let total = precio;

  if (tipo === "descuento" && promo > 0) {
    if (modo === "porcentaje") {
      descuento = Math.round(precio * (promo / 100));
    } else {
      descuento = Math.min(promo, precio);
    }
    total = precio - descuento;
  } else if (tipo === "reintegro" && promo > 0) {
    if (modo === "porcentaje") {
      reintegro = Math.round(precio * (promo / 100));
    } else {
      reintegro = promo;
    }
    total = precio;
  }

  const balanceAfter = balanceActual - total + reintegro;

  return {
    precioBase: precio,
    descuento,
    reintegro,
    total,
    balanceAfter,
    promoKey: `${data.comercio}|${data.producto}|${data.precio}|${data.promo}|${data.modo}|${data.tipo}`,
  };
}
