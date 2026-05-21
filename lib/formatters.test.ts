import { describe, it, expect } from "vitest";
import { formatValue, formatDate, formatCompact } from "./formatters";

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
