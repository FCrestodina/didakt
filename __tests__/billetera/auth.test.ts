import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/billetera/auth";

describe("hashPassword / verifyPassword", () => {
  it("verifica correctamente la misma contraseña", () => {
    const stored = hashPassword("Abc123");
    expect(verifyPassword("Abc123", stored)).toBe(true);
  });

  it("rechaza una contraseña distinta", () => {
    const stored = hashPassword("Abc123");
    expect(verifyPassword("Abc124", stored)).toBe(false);
  });

  it("genera hashes distintos por el salt aleatorio", () => {
    expect(hashPassword("Abc123")).not.toBe(hashPassword("Abc123"));
  });

  it("no rompe con un hash mal formado", () => {
    expect(verifyPassword("Abc123", "basura")).toBe(false);
  });
});
