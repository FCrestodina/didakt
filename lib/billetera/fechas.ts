import type { DiaSemana } from "@/types/billetera";

// Letras de los días tal como las usa el QR (dias=V) y como las muestran las
// promos de las billeteras reales (L M X J V S D). `clave` sirve para reconocer
// el nombre escrito a mano en un QR ("viernes", "vie").
export const DIAS_SEMANA: { letra: DiaSemana; clave: string; nombre: string; plural: string }[] = [
  { letra: "L", clave: "LUN", nombre: "lunes", plural: "lunes" },
  { letra: "M", clave: "MAR", nombre: "martes", plural: "martes" },
  { letra: "X", clave: "MIE", nombre: "miércoles", plural: "miércoles" },
  { letra: "J", clave: "JUE", nombre: "jueves", plural: "jueves" },
  { letra: "V", clave: "VIE", nombre: "viernes", plural: "viernes" },
  { letra: "S", clave: "SAB", nombre: "sábado", plural: "sábados" },
  { letra: "D", clave: "DOM", nombre: "domingo", plural: "domingos" },
];

// "los viernes", "los sábados y domingos", "los lunes, martes y miércoles".
export function listaDias(dias: DiaSemana[]): string {
  const nombres = DIAS_SEMANA.filter((d) => dias.includes(d.letra)).map((d) => d.plural);
  if (nombres.length <= 1) return `los ${nombres[0] ?? ""}`;
  return `los ${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

const MS_DIA = 86_400_000;
const MS_HORA = 3_600_000;

// Fecha en que "llega" un reintegro que se acredita a los N días hábiles del
// gasto. Cuenta sobre la fecha calendario de Argentina (UTC-3 todo el año, sin
// horario de verano), porque el server corre en UTC y un pago de las 22 h caería
// en el día siguiente. Saltea sábados y domingos; los feriados no se contemplan.
// Devuelve el mediodía argentino de ese día para que se vea la misma fecha en
// cualquier huso razonable.
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const local = new Date(desde.getTime() - 3 * MS_HORA);
  let fecha = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let restantes = dias;
  while (restantes > 0) {
    fecha += MS_DIA;
    const diaSemana = new Date(fecha).getUTCDay();
    if (diaSemana !== 0 && diaSemana !== 6) restantes--;
  }
  return new Date(fecha + 15 * MS_HORA);
}

// "jue 18/09"
export function formatFechaCorta(fecha: string | number | Date): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}
