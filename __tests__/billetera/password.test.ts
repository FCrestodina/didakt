import { describe, it, expect } from "vitest";
import { validatePassword, isPasswordValid } from "@/lib/billetera/password";

describe("validatePassword", () => {
  it("acepta una contraseña válida (min, may, num, 6-8)", () => {
    expect(validatePassword("Abc123")).toBeNull();
    expect(validatePassword("Abcd1234")).toBeNull();
    expect(isPasswordValid("Abc123")).toBe(true);
  });

  it("rechaza si es muy corta", () => {
    expect(validatePassword("Ab12")).toMatch(/entre 6 y 8/);
  });

  it("rechaza si es muy larga", () => {
    expect(validatePassword("Abcd12345")).toMatch(/entre 6 y 8/);
  });

  it("rechaza si no tiene minúscula", () => {
    expect(validatePassword("ABC123")).toMatch(/minúscula/);
  });

  it("rechaza si no tiene mayúscula", () => {
    expect(validatePassword("abc123")).toMatch(/mayúscula/);
  });

  it("rechaza si no tiene número", () => {
    expect(validatePassword("Abcdef")).toMatch(/número/);
  });

  it("isPasswordValid es false para inválida", () => {
    expect(isPasswordValid("abc")).toBe(false);
  });
});
