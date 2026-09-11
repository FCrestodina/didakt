import { buildQRText, type QRFormFields } from "@/lib/billetera/qr";

// QR listos para los Casos 1, 2 y 3 de la secuencia (las consignas que manda la
// docente). Se arman con buildQRText, así que siempre respetan el formato que lee
// la billetera, y cada uno se puede abrir en el generador para cambiarlo.

export interface QRDelKit {
  id: string;
  titulo: string;
  detalle: string;
  texto: string;
}

export interface CasoDelKit {
  id: string;
  titulo: string;
  consigna: string;
  notas: string[];
  qrs: QRDelKit[];
  respuestas: string[];
}

const VACIO: QRFormFields = {
  comercio: "",
  producto: "",
  precio: "",
  tipo: "normal",
  modo: "porcentaje",
  promo: "",
  tope: "",
};

function qr(campos: Partial<QRFormFields>): string {
  return buildQRText({ ...VACIO, ...campos });
}

const VIGENCIA = "Hasta el 31/05/2026";

export const CASOS: CasoDelKit[] = [
  {
    id: "caso-1",
    titulo: "Caso 1 · Llegar gratis al club",
    consigna:
      "Transporte con QR: 100 % de reintegro en viajes en colectivo, con tope de $8.000 por mes. El reintegro se acredita dentro de los 3 días hábiles.",
    notas: [
      "Cada estudiante hace de Juan: paga la ida y la vuelta de lunes a viernes. Con «Pagar de nuevo» carga los viajes uno por uno sin volver a escanear.",
      "Cada viaje suma su reintegro en la pestaña «A acreditar». En el viaje 10 llega al tope (devuelve $467) y desde el 11 ya no devuelve nada.",
      "En la clase siguiente, acreditá los reintegros desde el panel del aula («Reintegros a acreditar»). Para repetir la actividad, «Empezar mes nuevo» vuelve el tope a cero.",
      "Crédito sugerido para este caso: $33.480 (un mes de viajes: 40 × $837).",
    ],
    qrs: [
      {
        id: "colectivo",
        titulo: "Colectivo · pasaje $837",
        detalle: "100 % de reintegro · tope $8.000 por mes · se acredita a los 3 días hábiles",
        texto: qr({
          comercio: "Colectivo",
          producto: "Pasaje",
          precio: "837",
          tipo: "reintegro",
          modo: "porcentaje",
          promo: "100",
          acreditacion: "pendiente",
          plazo: "3",
          promocion: "Transporte con QR",
          topePesos: "8000",
          modalidad: "Pagando con QR",
          vigencia: VIGENCIA,
        }),
      },
    ],
    respuestas: [
      "1. Gasto mensual: $837 × 2 viajes × 5 días × 4 semanas = $33.480.",
      "2. $8.000 ÷ $837 = 9,56 viajes: cubre 9 viajes completos y $467 del décimo. Con 2 viajes por día, le alcanza para 4 días completos (y parte del quinto).",
      "3. Ahorra el tope entero: $8.000 en el mes (paga $25.480 en vez de $33.480).",
    ],
  },
  {
    id: "caso-2",
    titulo: "Caso 2 · De compras",
    consigna:
      "Supermercado Verde: 20 % de reintegro en compras presenciales, mínimo $100.000, tope $25.000 por mes. Mercado Azul: 15 % de reintegro solo los viernes, mínimo $30.000, sin tope.",
    notas: [
      "Los dos QR son de monto libre: el estudiante escribe cuánto es la compra ($200.000 o $50.000) y, en Mercado Azul, elige qué día la hace.",
      "Si en Mercado Azul elige un martes, la app le muestra que la promo no se aplica: probar las dos cosas es parte de la actividad.",
      "Los reintegros quedan en «A acreditar» hasta que los acredites desde el panel.",
      "Crédito sugerido: $300.000 si en la misma aula simulan la compra de $200.000 y además los otros casos.",
    ],
    qrs: [
      {
        id: "supermercado-verde",
        titulo: "Supermercado Verde",
        detalle: "20 % de reintegro · mínimo $100.000 · tope $25.000 por mes",
        texto: qr({
          comercio: "Supermercado Verde",
          producto: "Compra",
          precioLibre: true,
          tipo: "reintegro",
          modo: "porcentaje",
          promo: "20",
          acreditacion: "pendiente",
          topePesos: "25000",
          minimo: "100000",
          modalidad: "QR presencial",
          vigencia: VIGENCIA,
        }),
      },
      {
        id: "mercado-azul",
        titulo: "Mercado Azul",
        detalle: "15 % de reintegro · solo los viernes · mínimo $30.000",
        texto: qr({
          comercio: "Mercado Azul",
          producto: "Compra",
          precioLibre: true,
          tipo: "reintegro",
          modo: "porcentaje",
          promo: "15",
          acreditacion: "pendiente",
          minimo: "30000",
          dias: ["V"],
          modalidad: "QR o link de pago (online)",
          vigencia: VIGENCIA,
        }),
      },
    ],
    respuestas: [
      "1a. Conviene Mercado Azul, comprando un viernes: el 20 % de Verde serían $40.000, pero el tope lo corta en $25.000; el 15 % de Azul son $30.000 y no tiene tope.",
      "1b. En Mercado Azul les reintegran $30.000 (en Supermercado Verde serían $25.000).",
      "2. Mercado Azul: una compra de $50.000 no llega al mínimo de $100.000 de Verde, así que ahí no hay reintegro. En Azul, comprando los viernes, les devuelven $7.500 por compra ($30.000 en el mes).",
    ],
  },
  {
    id: "caso-3",
    titulo: "Caso 3 · ¡Ayuda!",
    consigna:
      "Cada producto tiene dos QR, uno por promo. El estudiante elige la cantidad al pagar y compara cuánto paga con cada una.",
    notas: [
      "Los precios son de ejemplo (la consigna solo da la gaseosa a $3.000). Se cambian con «Editar».",
      "Conviene probar cada promo con 1, 2 y 3 unidades: con 1 unidad el 2x1 y la 2.ª unidad no se aplican, y la app avisa por qué.",
    ],
    qrs: [
      {
        id: "gaseosa-2x1",
        titulo: "Gaseosa $3.000 · 2x1",
        detalle: "Llevá 2, pagá 1",
        texto: qr({ comercio: "Almacén", producto: "Gaseosa", precio: "3000", tipo: "nxm", lleva: "2", paga: "1" }),
      },
      {
        id: "gaseosa-50",
        titulo: "Gaseosa $3.000 · 50 % por unidad",
        detalle: "50 % de descuento en cada unidad",
        texto: qr({ comercio: "Almacén", producto: "Gaseosa", precio: "3000", tipo: "descuento", modo: "porcentaje", promo: "50" }),
      },
      {
        id: "leche-3x2",
        titulo: "Leche $1.800 · llevá 3, pagá 2",
        detalle: "3x2",
        texto: qr({ comercio: "Almacén", producto: "Leche", precio: "1800", tipo: "nxm", lleva: "3", paga: "2" }),
      },
      {
        id: "leche-2x1",
        titulo: "Leche $1.800 · 2x1",
        detalle: "Llevá 2, pagá 1",
        texto: qr({ comercio: "Almacén", producto: "Leche", precio: "1800", tipo: "nxm", lleva: "2", paga: "1" }),
      },
      {
        id: "papas-25",
        titulo: "Papas fritas $2.500 · 25 % por unidad",
        detalle: "25 % de descuento en cada unidad",
        texto: qr({ comercio: "Almacén", producto: "Papas fritas", precio: "2500", tipo: "descuento", modo: "porcentaje", promo: "25" }),
      },
      {
        id: "papas-segunda-50",
        titulo: "Papas fritas $2.500 · 50 % en la 2.ª",
        detalle: "50 % de descuento en la segunda unidad",
        texto: qr({ comercio: "Almacén", producto: "Papas fritas", precio: "2500", tipo: "segunda", promo: "50" }),
      },
      {
        id: "papel-25",
        titulo: "Papel higiénico $4.000 · 25 % por unidad",
        detalle: "25 % de descuento en cada unidad",
        texto: qr({ comercio: "Almacén", producto: "Papel higiénico", precio: "4000", tipo: "descuento", modo: "porcentaje", promo: "25" }),
      },
      {
        id: "papel-segunda-70",
        titulo: "Papel higiénico $4.000 · 70 % en la 2.ª",
        detalle: "70 % de descuento en la segunda unidad",
        texto: qr({ comercio: "Almacén", producto: "Papel higiénico", precio: "4000", tipo: "segunda", promo: "70" }),
      },
    ],
    respuestas: [
      "1. Llevando 2 gaseosas, las dos promos cuestan lo mismo: $3.000. Pero el 50 % por unidad también sirve con 1 o con 3 unidades, así que es igual o mejor.",
      "2. «Llevá 2x1» es la mejor: se paga la mitad (50 % de ahorro), contra un tercio (33 %) del 3x2. Con 6 leches: $5.400 con el 2x1 contra $7.200 con el 3x2.",
      "3. Llevando 2 paquetes, las dos dan lo mismo ($3.750): el 50 % en la segunda equivale a un 25 % sobre el par. Con 1 o con 3 unidades conviene el 25 % por unidad.",
      "4. Llevando una cantidad par conviene el 70 % en la 2.ª unidad: sobre cada par es un 35 % de descuento, contra 25 %. Con 1 sola unidad conviene el 25 %, y con 3 también, por poco ($9.000 contra $9.200).",
    ],
  },
];
