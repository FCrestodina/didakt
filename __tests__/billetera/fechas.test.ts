import { describe, it, expect } from "vitest";
import { sumarDiasHabiles, listaDias } from "@/lib/billetera/fechas";

describe("sumarDiasHabiles", () => {
  it("jueves + 3 días hábiles = martes (saltea el fin de semana)", () => {
    expect(sumarDiasHabiles(new Date("2026-09-10T13:00:00Z"), 3).toISOString()).toBe("2026-09-15T15:00:00.000Z");
  });

  it("viernes + 1 = lunes", () => {
    expect(sumarDiasHabiles(new Date("2026-09-11T13:00:00Z"), 1).toISOString()).toBe("2026-09-14T15:00:00.000Z");
  });

  it("cuenta desde la fecha argentina, no la UTC: jueves a las 22 h + 1 = viernes", () => {
    // 2026-09-11 01:00 UTC es el jueves 10 a las 22 h en Argentina. Contado en UTC
    // arrancaría el viernes y daría el lunes.
    expect(sumarDiasHabiles(new Date("2026-09-11T01:00:00Z"), 1).toISOString()).toBe("2026-09-11T15:00:00.000Z");
  });

  it("0 días = el mismo día", () => {
    expect(sumarDiasHabiles(new Date("2026-09-10T13:00:00Z"), 0).toISOString()).toBe("2026-09-10T15:00:00.000Z");
  });
});

describe("listaDias", () => {
  it("arma la frase en español", () => {
    expect(listaDias(["V"])).toBe("los viernes");
    expect(listaDias(["S", "D"])).toBe("los sábados y domingos");
    expect(listaDias(["X", "L", "M"])).toBe("los lunes, martes y miércoles");
  });
});
