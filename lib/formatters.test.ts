import { describe, it, expect } from "vitest";
import { formatValue, formatDate, formatCompact, fechaBA, hoyBA } from "./formatters";

describe("formatValue", () => {
  it("formatea percent multiplicando por 100", () => {
    expect(formatValue(0.026, "percent")).toBe("2.6%");
    expect(formatValue(0.123, "percent")).toBe("12.3%");
  });

  it("formatea peso con símbolo $", () => {
    expect(formatValue(1380, "peso")).toMatch(/^\$/);
    expect(formatValue(0, "peso")).toBe("$0");
  });

  it("formatea index sin decimales (>= 100)", () => {
    expect(formatValue(150, "index")).toBe("150");
  });

  it("formatea decimal con un decimal", () => {
    expect(formatValue(2.5, "decimal")).toMatch(/2,5/);
  });
});

describe("formatDate", () => {
  it("convierte YYYY-MM-DD a 'Mes YYYY'", () => {
    expect(formatDate("2024-01-15")).toBe("Ene 2024");
    expect(formatDate("2026-05-20")).toBe("May 2026");
  });

  it("retorna iso si el input es inválido", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("hola")).toBe("hola");
  });
});

describe("formatCompact", () => {
  it("formatea miles con K", () => {
    expect(formatCompact(1500)).toMatch(/K$/);
  });

  it("formatea millones con M", () => {
    expect(formatCompact(2_500_000)).toMatch(/M$/);
  });

  it("formatea miles de millones con B", () => {
    expect(formatCompact(3_000_000_000)).toMatch(/B$/);
  });

  it("números chicos quedan sin sufijo", () => {
    expect(formatCompact(42)).not.toMatch(/[KMB]$/);
  });

  it("respeta el signo negativo", () => {
    expect(formatCompact(-1_500_000)).toMatch(/^-/);
  });
});

describe("fechaBA", () => {
  it("convierte un ISO en UTC al día de Buenos Aires", () => {
    expect(fechaBA("2026-07-30T12:59:00.000Z")).toBe("2026-07-30");
    expect(fechaBA("2026-07-29T15:58:00.000Z")).toBe("2026-07-29");
  });

  it("de madrugada UTC todavía es el día anterior en BA (UTC-3)", () => {
    expect(fechaBA("2026-07-30T02:30:00.000Z")).toBe("2026-07-29");
    expect(fechaBA("2026-07-30T03:00:00.000Z")).toBe("2026-07-30");
  });

  it("cubre el borde de medianoche BA", () => {
    expect(fechaBA("2026-07-31T02:59:00.000Z")).toBe("2026-07-30");
  });

  it("retorna null si no hay fecha o es inválida", () => {
    expect(fechaBA(null)).toBeNull();
    expect(fechaBA(undefined)).toBeNull();
    expect(fechaBA("")).toBeNull();
    expect(fechaBA("hola")).toBeNull();
  });
});

describe("hoyBA", () => {
  it("devuelve YYYY-MM-DD", () => {
    expect(hoyBA()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("coincide con fechaBA aplicado al instante actual", () => {
    expect(hoyBA()).toBe(fechaBA(new Date().toISOString()));
  });
});
