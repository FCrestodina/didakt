import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/billetera/db";
import { POST } from "@/app/api/students/route";
import { hashPassword } from "@/lib/billetera/auth";
import { postRequest, mockSelect, mockInsert } from "./api-test-utils";

vi.mock("@/lib/billetera/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const URL = "http://localhost/api/students";

const classroom = { id: "c1", code: "5A", active: true, initialBalance: 1000 };

describe("POST /api/students", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
    vi.mocked(db.insert).mockReset();
  });

  it("rechaza si el aula no existe (o no está activa)", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    const req = postRequest(URL, { classroomCode: "9Z", username: "juan", password: "Abc123" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("rechaza un nombre de usuario vacío", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([classroom]) as unknown as ReturnType<typeof db.select>);
    const req = postRequest(URL, { classroomCode: "5A", username: "   ", password: "Abc123" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rechaza el login con contraseña incorrecta", async () => {
    const hash = hashPassword("Correct1");
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([classroom]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(
        mockSelect([
          { id: "s1", classroomId: "c1", username: "juan", passwordHash: hash, avatar: "astronauta", balance: 1000 },
        ]) as unknown as ReturnType<typeof db.select>
      );
    const req = postRequest(URL, { classroomCode: "5A", username: "juan", password: "Wrong1" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("permite el login de un usuario existente con la contraseña correcta", async () => {
    const hash = hashPassword("Correct1");
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([classroom]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(
        mockSelect([
          { id: "s1", classroomId: "c1", username: "juan", passwordHash: hash, avatar: "astronauta", balance: 1000 },
        ]) as unknown as ReturnType<typeof db.select>
      );
    const req = postRequest(URL, { classroomCode: "5A", username: "juan", password: "Correct1" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe("juan");
    expect(body.passwordHash).toBeUndefined();
  });

  it("rechaza el alta de un usuario nuevo con una contraseña que no cumple las reglas", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([classroom]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    const req = postRequest(URL, { classroomCode: "5A", username: "nuevo", password: "abc" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("da de alta a un estudiante nuevo con contraseña válida", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([classroom]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelect([]) as unknown as ReturnType<typeof db.select>);
    vi.mocked(db.insert).mockReturnValueOnce(
      mockInsert([
        { id: "s2", classroomId: "c1", username: "nuevo", passwordHash: "x", avatar: "astronauta", balance: 1000 },
      ]) as unknown as ReturnType<typeof db.insert>
    );
    const req = postRequest(URL, { classroomCode: "5A", username: "nuevo", password: "Abc123" });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.username).toBe("nuevo");
    expect(body.balance).toBe(1000);
    expect(body.passwordHash).toBeUndefined();
  });
});
