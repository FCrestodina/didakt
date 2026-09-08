import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/billetera/db";
import { POST } from "@/app/api/payments/route";
import { buildQRText } from "@/lib/billetera/qr";
import { postRequest, mockSelect, mockInsert, mockUpdate } from "./api-test-utils";

vi.mock("@/lib/billetera/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const URL = "http://localhost/api/payments";

const student = {
  id: "s1",
  classroomId: "c1",
  username: "juan",
  passwordHash: "x",
  avatar: "astronauta",
  balance: 5000,
};

function qr(overrides: Partial<Parameters<typeof buildQRText>[0]> = {}) {
  return buildQRText({
    comercio: "Kiosco",
    producto: "Alfajor",
    precio: "1000",
    tipo: "normal",
    modo: "porcentaje",
    promo: "",
    tope: "",
    ...overrides,
  });
}

describe("POST /api/payments", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
    vi.mocked(db.insert).mockReset();
    vi.mocked(db.update).mockReset();
  });

  it("rechaza si el estudiante no existe", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    const req = postRequest(URL, { studentId: "no-existe", qrText: qr() });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("rechaza un QR inválido (sin precio)", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([student]) as unknown as ReturnType<typeof db.select>);
    const req = postRequest(URL, { studentId: "s1", qrText: "comercio=Kiosco" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza si el saldo es insuficiente", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      mockSelect([{ ...student, balance: 100 }]) as unknown as ReturnType<typeof db.select>
    );
    const req = postRequest(URL, { studentId: "s1", qrText: qr({ precio: "5000" }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/[Ss]aldo insuficiente/);
  });

  it("rechaza si ya se alcanzó el tope de usos de la promo", async () => {
    const qrText = qr({ tipo: "descuento", modo: "porcentaje", promo: "10", tope: "1" });
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([student]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(
        mockSelect([{ id: "u1", studentId: "s1", promoKey: "x", usesCount: 1 }]) as unknown as ReturnType<typeof db.select>
      );
    const req = postRequest(URL, { studentId: "s1", qrText });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.limitReached).toBe(true);
  });

  it("procesa un pago exitoso y devuelve el nuevo balance", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([student]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.update).mockReturnValueOnce(mockUpdate() as unknown as ReturnType<typeof db.update>);
    vi.mocked(db.insert).mockReturnValueOnce(
      mockInsert([
        {
          id: "m1",
          studentId: "s1",
          classroomId: "c1",
          comercio: "Kiosco",
          producto: "Alfajor",
          precioBase: 1000,
          descuento: 0,
          reintegro: 0,
          total: 1000,
          balanceAfter: 4000,
          promoKey: null,
        },
      ]) as unknown as ReturnType<typeof db.insert>
    );
    const req = postRequest(URL, { studentId: "s1", qrText: qr() });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newBalance).toBe(4000);
    expect(db.update).toHaveBeenCalled();
  });
});
