export type Classroom = {
  id: string;
  code: string;
  initialBalance: number;
  createdAt: number;
  active: boolean;
  // "Mes simulado" del aula: los topes en pesos de las promos se cuentan dentro
  // de un mismo periodo y vuelven a cero cuando la docente empieza uno nuevo.
  periodo: number;
};

// Estudiante tal como lo consume el cliente (sin el hash de la contraseña).
export type Student = {
  id: string;
  classroomId: string;
  username: string;
  avatar: string;
  balance: number;
  joinedAt: number;
};

export type DiaSemana = "L" | "M" | "X" | "J" | "V" | "S" | "D";

export type Movement = {
  id: string;
  studentId: string;
  classroomId: string;
  timestamp: number;
  comercio: string;
  producto: string;
  precioBase: number;
  descuento: number;
  reintegro: number;
  total: number;
  balanceAfter: number;
  promoKey?: string;
  cantidad: number;
  // "pago" es una compra; "acreditacion" es la plata de reintegros pendientes
  // que la docente liberó desde el panel.
  tipoMovimiento: "pago" | "acreditacion";
  promocion?: string | null;
  periodo: number;
  diaCompra?: DiaSemana | null;
  estadoReintegro?: "pendiente" | "acreditado" | null;
  acreditaEl?: string | null;
  acreditadoAt?: string | null;
};

export type PromoUsage = {
  id: string;
  studentId: string;
  promoKey: string;
  usesCount: number;
};

export type QRData = {
  comercio: string;
  producto: string;
  // En un QR de monto libre vale 0: el monto lo escribe el estudiante al pagar.
  precio: number;
  precioLibre?: boolean;
  promo: number;
  modo: "porcentaje" | "monto";
  // nxm = "llevá N, pagá M" (2x1, 3x2); segunda = "X % en la 2.ª unidad".
  tipo: "descuento" | "reintegro" | "normal" | "nxm" | "segunda";
  // Tope de USOS por estudiante.
  tope?: number;
  lleva?: number;
  paga?: number;
  // Tope en PESOS del beneficio, acumulado por estudiante dentro del mes simulado.
  topePesos?: number;
  // Monto mínimo de la compra para que aplique la promo.
  minimo?: number;
  // Días en que aplica la promo; el estudiante elige qué día hace la compra.
  dias?: DiaSemana[];
  // "pendiente": el reintegro no entra al saldo en el momento, lo acredita la docente.
  acreditacion?: "instantanea" | "pendiente";
  // Días hábiles hasta la acreditación (informativo: la acredita la docente).
  plazo?: number;
  // Nombre de la promoción. Los QR con el mismo nombre comparten el tope en pesos
  // (ej. colectivo y subte en "Transporte con QR").
  promocion?: string;
  // Datos que se muestran pero no se controlan.
  modalidad?: string;
  vigencia?: string;
  condiciones?: string;
};

export type PaymentResult = {
  // Subtotal: precio por unidad x cantidad (o el monto escrito, si es libre).
  precioBase: number;
  cantidad: number;
  descuento: number;
  reintegro: number;
  total: number;
  balanceAfter: number;
  promoKey: string;
  // El reintegro queda a acreditar: no está sumado en balanceAfter.
  pendiente: boolean;
  // Por qué la promo no se aplicó (no llega al mínimo, no es el día, tope agotado...).
  motivoSinBeneficio?: string;
  // Cuánto queda del tope en pesos después de este pago.
  topeRestante?: number;
};

export type QRParseError =
  | "QR no válido."
  | "Falta el precio."
  | "El precio del QR no es válido."
  | "No se pudo leer la promoción.";
