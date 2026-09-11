import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/billetera/db";
import { POST as pagar } from "@/app/api/payments/route";
import { GET as listarAulas } from "@/app/api/classrooms/route";
import { POST as acreditar } from "@/app/api/classrooms/[code]/reintegros/route";
import { POST as empezarMes } from "@/app/api/classrooms/[code]/mes/route";
import { CASOS } from "@/lib/billetera/kit";
import { postRequest, mockSelect, mockUpdate, mockUpdateReturning } from "./api-test-utils";

vi.mock("@/lib/billetera/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), transaction: vi.fn() },
}));

type Select = ReturnType<typeof db.select>;
type Update = ReturnType<typeof db.update>;
type Insert = ReturnType<typeof db.insert>;

const PIN = "1234";
const kit = (id: string) => CASOS.flatMap((c) => c.qrs).find((q) => q.id === id)!.texto;
const student = {
  id: "s1",
  classroomId: "c1",
  username: "juan",
  passwordHash: "x",
  avatar: "astronauta",
  balance: 40000,
};
const aula = { id: "c1", code: "7B", active: true, initialBalance: 1000, periodo: 2 };
const params = () => ({ params: Promise.resolve({ code: "7B" }) });

// Captura lo que la ruta inserta en `movements`. El `returning` no devuelve los
// valores: `periodo` va como subconsulta SQL, que la base resuelve a un número.
function insertCapturando(destino: Record<string, unknown>[]) {
  return {
    values: (v: Record<string, unknown>) => {
      destino.push(v);
      return { returning: () => Promise.resolve([{ id: "m1" }]) };
    },
  } as unknown as Insert;
}

beforeEach(() => {
  process.env.TEACHER_PIN = PIN;
  vi.mocked(db.select).mockReset();
  vi.mocked(db.insert).mockReset();
  vi.mocked(db.update).mockReset();
  vi.mocked(db.transaction).mockReset();
});

describe("POST /api/payments con las promos nuevas", () => {
  const URL = "http://localhost/api/payments";

  it("un QR de monto libre sin monto → 400", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([student]) as unknown as Select);
    const res = await pagar(postRequest(URL, { studentId: "s1", qrText: kit("supermercado-verde") }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/monto/);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("una promo con días sin el día elegido → 400", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([student]) as unknown as Select);
    const res = await pagar(postRequest(URL, { studentId: "s1", qrText: kit("mercado-azul"), monto: 50000 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/día/);
  });

  it("el colectivo deja el reintegro pendiente con fecha y respeta el tope ya usado", async () => {
    const insertados: Record<string, unknown>[] = [];
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelect([student]) as unknown as Select)
      .mockReturnValueOnce(mockSelect([{ acumulado: 7533 }]) as unknown as Select);
    vi.mocked(db.update).mockReturnValueOnce(mockUpdate() as unknown as Update);
    vi.mocked(db.insert).mockReturnValueOnce(insertCapturando(insertados));

    const res = await pagar(postRequest(URL, { studentId: "s1", qrText: kit("colectivo") }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pendiente).toBe(true);
    expect(body.reintegro).toBe(467);
    // El reintegro pendiente no se suma al saldo.
    expect(body.newBalance).toBe(40000 - 837);
    expect(insertados[0]).toMatchObject({
      reintegro: 467,
      estadoReintegro: "pendiente",
      promocion: "Transporte con QR",
    });
    expect(insertados[0].acreditaEl).toBeInstanceOf(Date);
  });

  it("un 2x1 con 2 unidades cobra una sola", async () => {
    const insertados: Record<string, unknown>[] = [];
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([student]) as unknown as Select);
    vi.mocked(db.update).mockReturnValueOnce(mockUpdate() as unknown as Update);
    vi.mocked(db.insert).mockReturnValueOnce(insertCapturando(insertados));

    const res = await pagar(postRequest(URL, { studentId: "s1", qrText: kit("gaseosa-2x1"), cantidad: 2 }));

    expect(res.status).toBe(200);
    expect((await res.json()).newBalance).toBe(37000);
    expect(insertados[0]).toMatchObject({ cantidad: 2, precioBase: 6000, descuento: 3000, total: 3000 });
  });
});

describe("GET /api/classrooms (aulas abiertas)", () => {
  const URL = "http://localhost/api/classrooms";

  it("sin PIN → 401 y no consulta la base", async () => {
    const res = await listarAulas(new NextRequest(URL));
    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("sin TEACHER_PIN configurado no entra nadie", async () => {
    delete process.env.TEACHER_PIN;
    const res = await listarAulas(new NextRequest(URL, { headers: { "x-teacher-pin": "" } }));
    expect(res.status).toBe(401);
  });

  it("con el PIN devuelve las aulas abiertas", async () => {
    const filas = [{ id: "c1", code: "7B", estudiantes: 3 }];
    vi.mocked(db.select).mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({ where: () => ({ groupBy: () => ({ orderBy: () => Promise.resolve(filas) }) }) }),
      }),
    } as unknown as Select);
    const res = await listarAulas(new NextRequest(URL, { headers: { "x-teacher-pin": PIN } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(filas);
  });
});

describe("POST /api/classrooms/[code]/reintegros", () => {
  const URL = "http://localhost/api/classrooms/7B/reintegros";

  it("PIN incorrecto → 401", async () => {
    const res = await acreditar(postRequest(URL, { pin: "0000" }), params());
    expect(res.status).toBe(401);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("aula inexistente → 404", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([]) as unknown as Select);
    const res = await acreditar(postRequest(URL, { pin: PIN }), params());
    expect(res.status).toBe(404);
  });

  it("acredita, suma por estudiante y deja un movimiento de acreditación", async () => {
    vi.mocked(db.select).mockReturnValueOnce(mockSelect([aula]) as unknown as Select);
    const insertados: Record<string, unknown>[] = [];
    const tx = {
      update: vi
        .fn()
        .mockReturnValueOnce(
          mockUpdateReturning([
            { studentId: "s1", promocion: "Transporte con QR", reintegro: 837 },
            { studentId: "s1", promocion: "Transporte con QR", reintegro: 837 },
            { studentId: "s2", promocion: "Transporte con QR", reintegro: 467 },
          ])
        )
        .mockReturnValueOnce(mockUpdateReturning([{ balance: 11674 }]))
        .mockReturnValueOnce(mockUpdateReturning([{ balance: 5467 }])),
      insert: vi.fn(() => ({
        values: (v: Record<string, unknown>) => {
          insertados.push(v);
          return Promise.resolve();
        },
      })),
    };
    vi.mocked(db.transaction).mockImplementationOnce(((fn: (t: typeof tx) => unknown) => fn(tx)) as never);

    const res = await acreditar(postRequest(URL, { pin: PIN, promocion: "Transporte con QR" }), params());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ compras: 3, estudiantes: 2, total: 2141 });
    expect(insertados).toHaveLength(2);
    expect(insertados[0]).toMatchObject({
      studentId: "s1",
      reintegro: 1674,
      total: 0,
      balanceAfter: 11674,
      tipoMovimiento: "acreditacion",
      producto: "Reintegro de 2 compras",
      periodo: 2,
    });
    expect(insertados[1]).toMatchObject({ studentId: "s2", reintegro: 467, producto: "Reintegro de 1 compra" });
  });
});

describe("POST /api/classrooms/[code]/mes", () => {
  const URL = "http://localhost/api/classrooms/7B/mes";

  it("PIN incorrecto → 401", async () => {
    const res = await empezarMes(postRequest(URL, { pin: "0000" }), params());
    expect(res.status).toBe(401);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("aula inexistente o cerrada → 404", async () => {
    vi.mocked(db.update).mockReturnValueOnce(mockUpdateReturning([]) as unknown as Update);
    const res = await empezarMes(postRequest(URL, { pin: PIN }), params());
    expect(res.status).toBe(404);
  });

  it("avanza el mes simulado", async () => {
    vi.mocked(db.update).mockReturnValueOnce(mockUpdateReturning([{ ...aula, periodo: 3 }]) as unknown as Update);
    const res = await empezarMes(postRequest(URL, { pin: PIN }), params());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ periodo: 3 });
  });
});
