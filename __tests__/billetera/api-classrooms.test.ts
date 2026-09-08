import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/billetera/db";
import { POST } from "@/app/api/classrooms/route";
import { PATCH, DELETE } from "@/app/api/classrooms/[code]/route";
import {
  postRequest,
  patchRequest,
  mockSelect,
  mockInsert,
  mockUpdateReturning,
} from "./api-test-utils";

vi.mock("@/lib/billetera/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const URL = "http://localhost/api/classrooms";
const PIN = "1234";

describe("POST /api/classrooms", () => {
  beforeEach(() => {
    process.env.TEACHER_PIN = PIN;
    vi.mocked(db.select).mockReset();
    vi.mocked(db.insert).mockReset();
    vi.mocked(db.update).mockReset();
    vi.mocked(db.delete).mockReset();
  });

  it("rechaza con PIN incorrecto", async () => {
    const req = postRequest(URL, { pin: "0000", code: "5A", initialBalance: "1000" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/PIN/);
  });

  it("rechaza código de aula vacío", async () => {
    const req = postRequest(URL, { pin: PIN, code: "   ", initialBalance: "1000" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza crédito inicial inválido", async () => {
    const req = postRequest(URL, { pin: PIN, code: "5A", initialBalance: "-10" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza si ya existe un aula activa con ese código", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      mockSelect([{ id: "c1", code: "5A", active: true, initialBalance: 1000 }]) as unknown as ReturnType<typeof db.select>
    );
    const req = postRequest(URL, { pin: PIN, code: "5A", initialBalance: "1000" });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("archiva el aula inactiva en vez de borrarla y reusa el código", async () => {
    let renombrada: { code?: string } | undefined;
    vi.mocked(db.select).mockReturnValueOnce(
      mockSelect([{ id: "c1", code: "5A", active: false, initialBalance: 500 }]) as unknown as ReturnType<typeof db.select>
    );
    vi.mocked(db.update).mockReturnValueOnce({
      set: (v: { code?: string }) => {
        renombrada = v;
        return { where: () => Promise.resolve(undefined) };
      },
    } as unknown as ReturnType<typeof db.update>);
    vi.mocked(db.insert).mockReturnValueOnce(
      mockInsert([{ id: "c2", code: "5A", active: true, initialBalance: 2000 }]) as unknown as ReturnType<typeof db.insert>
    );

    const req = postRequest(URL, { pin: PIN, code: "5A", initialBalance: "2000" });
    const res = await POST(req);

    expect(res.status).toBe(201);
    // Un DELETE reventaría por FK si el aula vieja tuvo estudiantes (BUG-009).
    expect(db.delete).not.toHaveBeenCalled();
    expect(renombrada?.code).toContain("5A (cerrada ");
    expect(renombrada?.code).toContain("c1");
  });

  it("crea el aula exitosamente", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.insert).mockReturnValueOnce(
      mockInsert([{ id: "c1", code: "5A", active: true, initialBalance: 1000 }]) as unknown as ReturnType<typeof db.insert>
    );
    const req = postRequest(URL, { pin: PIN, code: "5A", initialBalance: "1000" });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.code).toBe("5A");
    expect(body.initialBalance).toBe(1000);
  });
});

const PATCH_URL = "http://localhost/api/classrooms/5A";
const params = Promise.resolve({ code: "5A" });
const AULA = { id: "c1", code: "5A", active: true, initialBalance: 1000 };

describe("PATCH /api/classrooms/[code]", () => {
  beforeEach(() => {
    process.env.TEACHER_PIN = PIN;
    vi.mocked(db.select).mockReset();
    vi.mocked(db.update).mockReset();
  });

  it("rechaza con PIN incorrecto", async () => {
    const res = await PATCH(patchRequest(PATCH_URL, { pin: "0000", initialBalance: "5000" }), {
      params,
    });
    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("rechaza si no viene ningún cambio", async () => {
    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN }), { params });
    expect(res.status).toBe(400);
  });

  it("rechaza un crédito inicial <= 0", async () => {
    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN, initialBalance: "0" }), { params });
    expect(res.status).toBe(400);
  });

  it("rechaza un ajuste de saldo igual a cero", async () => {
    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN, balanceAdjustment: "0" }), {
      params,
    });
    expect(res.status).toBe(400);
  });

  it("devuelve 404 si el aula no existe o está inactiva", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN, initialBalance: "5000" }), {
      params,
    });
    expect(res.status).toBe(404);
  });

  it("cambia el crédito inicial sin tocar los saldos actuales", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([AULA]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.update).mockReturnValueOnce(
      mockUpdateReturning([{ ...AULA, initialBalance: 50000 }]) as unknown as ReturnType<typeof db.update>
    );

    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN, initialBalance: "50000" }), {
      params,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classroom.initialBalance).toBe(50000);
    expect(body.studentsUpdated).toBe(0);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("suma un monto a los saldos de los estudiantes del aula", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([AULA]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.update).mockReturnValueOnce(
      mockUpdateReturning([{ id: "s1" }, { id: "s2" }]) as unknown as ReturnType<typeof db.update>
    );

    const res = await PATCH(patchRequest(PATCH_URL, { pin: PIN, balanceAdjustment: "40000" }), {
      params,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.studentsUpdated).toBe(2);
    expect(body.classroom.initialBalance).toBe(1000);
  });

  it("hace los dos cambios en la misma llamada", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([AULA]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.update)
      .mockReturnValueOnce(
        mockUpdateReturning([{ ...AULA, initialBalance: 50000 }]) as unknown as ReturnType<typeof db.update>
      )
      .mockReturnValueOnce(mockUpdateReturning([{ id: "s1" }]) as unknown as ReturnType<typeof db.update>);

    const res = await PATCH(
      patchRequest(PATCH_URL, { pin: PIN, initialBalance: "50000", balanceAdjustment: "40000" }),
      { params }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classroom.initialBalance).toBe(50000);
    expect(body.studentsUpdated).toBe(1);
    expect(db.update).toHaveBeenCalledTimes(2);
  });
});

describe("DELETE /api/classrooms/[code]", () => {
  beforeEach(() => {
    process.env.TEACHER_PIN = PIN;
    vi.mocked(db.update).mockReset();
  });

  it("rechaza con PIN incorrecto y no toca el aula", async () => {
    const req = new Request(PATCH_URL, {
      method: "DELETE",
      body: JSON.stringify({ pin: "0000" }),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req as never, { params });
    expect(res.status).toBe(401);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("da de baja el aula con el PIN correcto", async () => {
    let baja: { active?: boolean } | undefined;
    vi.mocked(db.update).mockReturnValueOnce({
      set: (v: { active?: boolean }) => {
        baja = v;
        return { where: () => Promise.resolve(undefined) };
      },
    } as unknown as ReturnType<typeof db.update>);

    const req = new Request(PATCH_URL, {
      method: "DELETE",
      body: JSON.stringify({ pin: PIN }),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req as never, { params });

    expect(res.status).toBe(200);
    expect(baja).toEqual({ active: false });
  });
});
