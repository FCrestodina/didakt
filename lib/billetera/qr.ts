import type { DiaSemana, QRData, QRParseError } from "@/types/billetera";
import { DIAS_SEMANA } from "@/lib/billetera/fechas";

export type QRParseResult =
  | { ok: true; data: QRData }
  | { ok: false; error: QRParseError };

const TIPOS: QRData["tipo"][] = ["descuento", "reintegro", "normal", "nxm", "segunda"];

export function parseQR(raw: string): QRParseResult {
  const lines = raw.trim().split(/\r?\n/);
  const map: Record<string, string> = {};

  for (const line of lines) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().toLowerCase();
    const value = line.slice(eq + 1).trim();
    map[key] = value;
  }

  if (!map["precio"]) {
    return { ok: false, error: "Falta el precio." };
  }

  // precio=libre: el QR no trae el monto y lo escribe el estudiante al pagar
  // (la compra del súper, que cambia en cada problema).
  const precioLibre = map["precio"].toLowerCase() === "libre";
  const precio = precioLibre ? 0 : parseInt(map["precio"], 10);
  if (!precioLibre && (isNaN(precio) || precio <= 0)) {
    return { ok: false, error: "El precio del QR no es válido." };
  }

  const tipoRaw = (map["tipo"] ?? "normal").toLowerCase() as QRData["tipo"];
  if (!TIPOS.includes(tipoRaw)) {
    return { ok: false, error: "No se pudo leer la promoción." };
  }

  const modoRaw = (map["modo"] ?? "porcentaje").toLowerCase();
  if (!["porcentaje", "monto"].includes(modoRaw)) {
    return { ok: false, error: "No se pudo leer la promoción." };
  }

  // Las promos por unidad no tienen sentido sin un precio por unidad.
  if (precioLibre && (tipoRaw === "nxm" || tipoRaw === "segunda")) {
    return { ok: false, error: "No se pudo leer la promoción." };
  }

  const lleva = entero(map["lleva"], 2);
  const paga = entero(map["paga"], 1);
  if (tipoRaw === "nxm" && (lleva === undefined || paga === undefined || paga >= lleva)) {
    return { ok: false, error: "No se pudo leer la promoción." };
  }

  const promo = parseFloat(map["promo"] ?? "0");
  const tope = map["tope"] ? parseInt(map["tope"], 10) : undefined;

  const data: QRData = {
    comercio: map["comercio"] ?? "Comercio",
    producto: map["producto"] ?? "Producto",
    precio,
    promo: isNaN(promo) ? 0 : promo,
    modo: modoRaw as QRData["modo"],
    tipo: tipoRaw,
    tope: tope && !isNaN(tope) ? tope : undefined,
  };

  // Los campos nuevos solo aparecen si vienen en el QR, para que un QR viejo se
  // lea exactamente igual que antes.
  if (precioLibre) data.precioLibre = true;
  if (tipoRaw === "nxm") {
    data.lleva = lleva;
    data.paga = paga;
  }
  const topePesos = entero(map["tope_pesos"], 1);
  if (topePesos !== undefined) data.topePesos = topePesos;
  const minimo = entero(map["minimo"], 1);
  if (minimo !== undefined) data.minimo = minimo;
  const dias = parseDias(map["dias"]);
  if (dias) data.dias = dias;
  if (map["acreditacion"]?.toLowerCase() === "pendiente") data.acreditacion = "pendiente";
  const plazo = entero(map["plazo"], 0);
  if (plazo !== undefined) data.plazo = plazo;
  if (map["promocion"]) data.promocion = map["promocion"];
  if (map["modalidad"]) data.modalidad = map["modalidad"];
  if (map["vigencia"]) data.vigencia = map["vigencia"];
  if (map["condiciones"]) data.condiciones = map["condiciones"];

  return { ok: true, data };
}

// Entero >= minimo, o undefined si falta o no es válido (igual que `tope`: un
// valor corrupto se ignora en vez de invalidar el QR).
function entero(v: string | undefined, minimo: number): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) || n < minimo ? undefined : n;
}

// Acepta letras ("V", "LMXJV") o nombres ("viernes", "sáb, dom").
function parseDias(v: string | undefined): DiaSemana[] | undefined {
  if (!v) return undefined;
  const letras = DIAS_SEMANA.map((d) => d.letra as string);
  const elegidos = new Set<string>();
  const tokens = v
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[\s,;/-]+/);
  for (const token of tokens) {
    if (!token) continue;
    if ([...token].every((c) => letras.includes(c))) {
      for (const c of token) elegidos.add(c);
    } else {
      const dia = DIAS_SEMANA.find((d) => token.startsWith(d.clave));
      if (dia) elegidos.add(dia.letra);
    }
  }
  const lista = DIAS_SEMANA.map((d) => d.letra).filter((l) => elegidos.has(l));
  return lista.length > 0 ? lista : undefined;
}

export function calcularPromoKey(data: QRData): string {
  const base = `${data.comercio}|${data.producto}|${data.precio}|${data.promo}|${data.modo}|${data.tipo}`;
  // El sufijo solo existe para nxm: las claves de los QR anteriores no cambian y
  // sus contadores de usos siguen valiendo.
  return data.tipo === "nxm" ? `${base}|${data.lleva}x${data.paga}` : base;
}

// Con qué se agrupa una promo para el tope en pesos y para los reintegros
// pendientes del panel docente.
export function grupoPromo(data: QRData): string {
  return data.promocion?.trim() || `${data.comercio} · ${data.producto}`;
}

export interface QRFormFields {
  comercio: string;
  producto: string;
  precio: string;
  tipo: QRData["tipo"];
  modo: "porcentaje" | "monto";
  promo: string;
  tope: string;
  precioLibre?: boolean;
  lleva?: string;
  paga?: string;
  topePesos?: string;
  minimo?: string;
  dias?: DiaSemana[];
  acreditacion?: "instantanea" | "pendiente";
  plazo?: string;
  promocion?: string;
  modalidad?: string;
  vigencia?: string;
  condiciones?: string;
}

// Un salto de línea partiría el campo en dos líneas del QR.
function limpio(v: string | undefined): string {
  return (v ?? "").replace(/[\r\n]+/g, " ").trim();
}

// Arma el texto plano del QR en el mismo formato que espera parseQR.
export function buildQRText(f: QRFormFields): string {
  const lines: string[] = [];
  if (limpio(f.comercio)) lines.push(`comercio=${limpio(f.comercio)}`);
  if (limpio(f.producto)) lines.push(`producto=${limpio(f.producto)}`);
  lines.push(`precio=${f.precioLibre ? "libre" : f.precio}`);
  if (f.tipo === "descuento" || f.tipo === "reintegro") {
    lines.push(`promo=${f.promo || "0"}`);
    lines.push(`modo=${f.modo}`);
    lines.push(`tipo=${f.tipo}`);
  } else if (f.tipo === "nxm") {
    lines.push(`tipo=nxm`);
    lines.push(`lleva=${limpio(f.lleva)}`);
    lines.push(`paga=${limpio(f.paga)}`);
  } else if (f.tipo === "segunda") {
    lines.push(`promo=${f.promo || "0"}`);
    lines.push(`tipo=segunda`);
  }
  if (f.tipo === "reintegro" && f.acreditacion === "pendiente") {
    lines.push(`acreditacion=pendiente`);
    if (limpio(f.plazo)) lines.push(`plazo=${limpio(f.plazo)}`);
  }
  if (f.tipo !== "normal") {
    if (limpio(f.promocion)) lines.push(`promocion=${limpio(f.promocion)}`);
    if (limpio(f.topePesos)) lines.push(`tope_pesos=${limpio(f.topePesos)}`);
    if (limpio(f.minimo)) lines.push(`minimo=${limpio(f.minimo)}`);
    if (f.dias && f.dias.length > 0) {
      const orden = DIAS_SEMANA.map((d) => d.letra).filter((l) => f.dias!.includes(l));
      lines.push(`dias=${orden.join("")}`);
    }
  }
  if (f.tope.trim()) lines.push(`tope=${f.tope.trim()}`);
  if (limpio(f.modalidad)) lines.push(`modalidad=${limpio(f.modalidad)}`);
  if (limpio(f.vigencia)) lines.push(`vigencia=${limpio(f.vigencia)}`);
  if (limpio(f.condiciones)) lines.push(`condiciones=${limpio(f.condiciones)}`);
  return lines.join("\n");
}

// Inversa de buildQRText: carga un QR existente en el formulario del generador.
export function formDesdeQR(d: QRData): QRFormFields {
  return {
    comercio: d.comercio,
    producto: d.producto,
    precio: d.precioLibre ? "" : String(d.precio),
    tipo: d.tipo,
    modo: d.modo,
    promo: d.promo ? String(d.promo) : "",
    tope: d.tope !== undefined ? String(d.tope) : "",
    precioLibre: d.precioLibre ?? false,
    lleva: d.lleva !== undefined ? String(d.lleva) : "2",
    paga: d.paga !== undefined ? String(d.paga) : "1",
    topePesos: d.topePesos !== undefined ? String(d.topePesos) : "",
    minimo: d.minimo !== undefined ? String(d.minimo) : "",
    dias: d.dias ?? [],
    acreditacion: d.acreditacion ?? "instantanea",
    plazo: d.plazo !== undefined ? String(d.plazo) : "",
    promocion: d.promocion ?? "",
    modalidad: d.modalidad ?? "",
    vigencia: d.vigencia ?? "",
    condiciones: d.condiciones ?? "",
  };
}
