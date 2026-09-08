import { NextRequest } from "next/server";

// Helpers compartidos para testear route handlers de app/api/** con Vitest.
// Los handlers usan `db` (drizzle) con la cadena fluida select().from().where(),
// insert().values().returning(), update().set().where() y delete().where().
// Estos helpers arman objetos que imitan esa cadena y resuelven a los valores
// que cada test necesita, sin tocar una base de datos real.

export function postRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

export function patchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

export function mockSelect(rows: unknown[]) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) };
}

export function mockInsert(rows: unknown[]) {
  return { values: () => ({ returning: () => Promise.resolve(rows) }) };
}

export function mockUpdate() {
  return { set: () => ({ where: () => Promise.resolve(undefined) }) };
}

export function mockUpdateReturning(rows: unknown[]) {
  return { set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }) };
}

export function mockDelete() {
  return { where: () => Promise.resolve(undefined) };
}
