import type { DiaSemana, QRData, PaymentResult } from "@/types/billetera";
import { calcularPromoKey } from "@/lib/billetera/qr";
import { formatPesos } from "@/lib/billetera/format";
import { DIAS_SEMANA, listaDias } from "@/lib/billetera/fechas";

export interface OpcionesPago {
  // Unidades que se llevan (QR de precio fijo).
  cantidad?: number;
  // Monto escrito por el estudiante (QR de monto libre).
  monto?: number;
  // Día de la semana en que el estudiante dice hacer la compra.
  dia?: DiaSemana;
  // Beneficio ya recibido en el mes simulado con esta misma promo (tope en pesos).
  acumulado?: number;
}

export const CANTIDAD_MAXIMA = 99;
export const MONTO_MAXIMO = 100_000_000;

export function calcularPago(
  data: QRData,
  balanceActual: number,
  opciones: OpcionesPago = {}
): PaymentResult {
  const cantidad = data.precioLibre ? 1 : Math.max(1, Math.floor(opciones.cantidad ?? 1));
  const unitario = data.precioLibre ? Math.max(0, Math.floor(opciones.monto ?? 0)) : data.precio;
  const subtotal = unitario * cantidad;

  const bruto = beneficioBruto(data, unitario, cantidad, subtotal, opciones.dia);
  let beneficio = bruto.monto;
  let motivoSinBeneficio = bruto.motivo;
  let topeRestante: number | undefined;

  if (data.topePesos !== undefined && data.tipo !== "normal") {
    const disponible = Math.max(0, data.topePesos - (opciones.acumulado ?? 0));
    if (beneficio > 0 && disponible === 0) {
      motivoSinBeneficio = `Ya usaste todo el tope de ${formatPesos(data.topePesos)} de esta promo en el mes.`;
    }
    beneficio = Math.min(beneficio, disponible);
    topeRestante = disponible - beneficio;
  }

  const esReintegro = data.tipo === "reintegro";
  // Un descuento nunca deja el total en negativo; un reintegro por monto sí puede
  // superar lo pagado (RN-25).
  const descuento = esReintegro ? 0 : Math.min(beneficio, subtotal);
  const reintegro = esReintegro ? beneficio : 0;
  const total = subtotal - descuento;
  const pendiente = reintegro > 0 && data.acreditacion === "pendiente";

  // El reintegro pendiente no entra al saldo ahora: lo acredita la docente después.
  const balanceAfter = balanceActual - total + (pendiente ? 0 : reintegro);

  return {
    precioBase: subtotal,
    cantidad,
    descuento,
    reintegro,
    total,
    balanceAfter,
    promoKey: calcularPromoKey(data),
    pendiente,
    motivoSinBeneficio,
    topeRestante,
  };
}

function beneficioBruto(
  data: QRData,
  unitario: number,
  cantidad: number,
  subtotal: number,
  dia: DiaSemana | undefined
): { monto: number; motivo?: string } {
  if (data.tipo === "normal") return { monto: 0 };

  if (data.minimo !== undefined && subtotal < data.minimo) {
    return { monto: 0, motivo: `La compra no llega al mínimo de ${formatPesos(data.minimo)}.` };
  }
  if (data.dias && (!dia || !data.dias.includes(dia))) {
    // Sin día elegido todavía no hay motivo que mostrar: el modal lo está pidiendo.
    return { monto: 0, motivo: dia ? `Esta promo es solo ${listaDias(data.dias)}.` : undefined };
  }

  switch (data.tipo) {
    case "descuento":
      if (data.promo <= 0) return { monto: 0 };
      return {
        monto:
          data.modo === "porcentaje"
            ? Math.round(subtotal * (data.promo / 100))
            : Math.min(data.promo, unitario) * cantidad,
      };
    case "reintegro":
      if (data.promo <= 0) return { monto: 0 };
      return {
        monto:
          data.modo === "porcentaje" ? Math.round(subtotal * (data.promo / 100)) : data.promo * cantidad,
      };
    case "nxm": {
      const lleva = data.lleva ?? 2;
      const paga = data.paga ?? 1;
      const grupos = Math.floor(cantidad / lleva);
      if (grupos === 0) {
        return { monto: 0, motivo: `Para el ${lleva}x${paga} tenés que llevar ${lleva} unidades.` };
      }
      return { monto: grupos * (lleva - paga) * unitario };
    }
    case "segunda": {
      const pares = Math.floor(cantidad / 2);
      if (pares === 0 || data.promo <= 0) {
        return { monto: 0, motivo: data.promo > 0 ? "Llevando 1 sola unidad no hay 2.ª unidad con descuento." : undefined };
      }
      return { monto: Math.round(pares * unitario * (data.promo / 100)) };
    }
  }
}

// Valida lo que el estudiante elige al pagar (cantidad, monto, día) contra lo que
// el QR necesita. Vive acá y no en la ruta porque el preview y el pago lo comparten.
export function leerOpciones(
  data: QRData,
  body: { cantidad?: unknown; monto?: unknown; dia?: unknown }
): { ok: true; opciones: OpcionesPago } | { ok: false; error: string } {
  const opciones: OpcionesPago = {};

  if (data.precioLibre) {
    const monto = Number(body.monto);
    if (!Number.isInteger(monto) || monto <= 0 || monto > MONTO_MAXIMO) {
      return { ok: false, error: "Escribí el monto de la compra." };
    }
    opciones.monto = monto;
  } else if (body.cantidad !== undefined && body.cantidad !== null) {
    const cantidad = Number(body.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      return { ok: false, error: "La cantidad no es válida." };
    }
    opciones.cantidad = cantidad;
  }

  if (data.dias) {
    const dia = typeof body.dia === "string" ? body.dia.toUpperCase() : "";
    if (!DIAS_SEMANA.some((d) => d.letra === dia)) {
      return { ok: false, error: "Elegí qué día hacés la compra." };
    }
    opciones.dia = dia as DiaSemana;
  }

  return { ok: true, opciones };
}
