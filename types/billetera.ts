export type Classroom = {
  id: string;
  code: string;
  initialBalance: number;
  createdAt: number;
  active: boolean;
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
  precio: number;
  promo: number;
  modo: "porcentaje" | "monto";
  tipo: "descuento" | "reintegro" | "normal";
  tope?: number;
};

export type PaymentResult = {
  precioBase: number;
  descuento: number;
  reintegro: number;
  total: number;
  balanceAfter: number;
  promoKey: string;
};

export type QRParseError =
  | "QR no válido."
  | "Falta el precio."
  | "El precio del QR no es válido."
  | "No se pudo leer la promoción.";
