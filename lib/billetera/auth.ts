// Hashing de contraseñas con scrypt nativo de Node (sin dependencias externas).
// Solo debe importarse desde código de servidor (API routes), nunca del cliente.
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, KEYLEN);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}
