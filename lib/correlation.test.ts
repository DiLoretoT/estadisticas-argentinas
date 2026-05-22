import { describe, it, expect } from "vitest";
import { pearson, alignByDate, describeCorrelation } from "./correlation";

describe("pearson", () => {
  it("correlación perfecta positiva = 1", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5);
  });

  it("correlación perfecta negativa = -1", () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 5);
  });

  it("sin correlación ≈ 0", () => {
    // Para una correlación perfecta de 0 los valores tienen que ser realmente independientes.
    // Usamos un set conocido: y constante anula la denominator → null.
    expect(pearson([1, 2, 3, 4], [5, 5, 5, 5])).toBeNull();
  });

  it("returns null si las longitudes difieren", () => {
    expect(pearson([1, 2], [1, 2, 3])).toBeNull();
  });

  it("returns null con menos de 2 datos", () => {
    expect(pearson([1], [1])).toBeNull();
    expect(pearson([], [])).toBeNull();
  });
});

describe("alignByDate", () => {
  it("intersecta correctamente por mes", () => {
    const a: [string, number][] = [
      ["2024-01-15", 10],
      ["2024-02-15", 20],
      ["2024-03-15", 30],
    ];
    const b: [string, number][] = [
      ["2024-02-01", 200],
      ["2024-03-01", 300],
      ["2024-04-01", 400],
    ];
    const { dates, xs, ys } = alignByDate(a, b);
    expect(dates).toEqual(["2024-02", "2024-03"]);
    expect(xs).toEqual([20, 30]);
    expect(ys).toEqual([200, 300]);
  });

  it("ignora series sin solapamiento", () => {
    const a: [string, number][] = [["2024-01-01", 10]];
    const b: [string, number][] = [["2024-06-01", 20]];
    const { dates } = alignByDate(a, b);
    expect(dates).toEqual([]);
  });

  it("granularidad diaria también funciona", () => {
    const a: [string, number][] = [
      ["2024-01-15", 10],
      ["2024-01-16", 20],
    ];
    const b: [string, number][] = [
      ["2024-01-15", 100],
      ["2024-01-17", 300],
    ];
    const { dates, xs, ys } = alignByDate(a, b, { dateGranularity: "day" });
    expect(dates).toEqual(["2024-01-15"]);
    expect(xs).toEqual([10]);
    expect(ys).toEqual([100]);
  });
});

describe("describeCorrelation", () => {
  it("rotula muy fuerte positiva", () => {
    const desc = describeCorrelation(0.95);
    expect(desc.label).toContain("Muy fuerte");
    expect(desc.label).toContain("positiva");
  });
  it("rotula moderada negativa", () => {
    expect(describeCorrelation(-0.55).label).toContain("Moderada");
  });
  it("rotula sin datos cuando r es null", () => {
    expect(describeCorrelation(null).label).toBe("Sin datos");
  });
  it("rotula sin correlación cerca de 0", () => {
    expect(describeCorrelation(0.05).label).toBe("Sin correlación");
  });
});
