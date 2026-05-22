import { describe, it, expect } from "vitest";
import { analyzeSeries } from "./analysisEngine";

describe("analyzeSeries", () => {
  it("retorna null con series demasiado cortas", () => {
    const r = analyzeSeries({
      data: [
        ["2025-01-01", 1],
        ["2025-02-01", 2],
      ],
      noun: "el indicador",
    });
    expect(r).toBeNull();
  });

  it("detecta tendencia creciente fuerte (inflación)", () => {
    const data: [string, number][] = [
      ["2024-01-01", 100],
      ["2024-02-01", 110],
      ["2024-03-01", 122],
      ["2024-04-01", 135],
      ["2024-05-01", 150],
      ["2024-06-01", 165],
    ];
    const r = analyzeSeries({
      data,
      noun: "el dólar oficial",
      format: "currency_ars",
    });
    expect(r).not.toBeNull();
    expect(r!.metrics.trend).toMatch(/creciente/);
    expect(r!.metrics.lastValue).toBe(165);
  });

  it("detecta tendencia decreciente", () => {
    const data: [string, number][] = Array.from({ length: 12 }, (_, i) => [
      `2024-${String(i + 1).padStart(2, "0")}-01`,
      100 - i * 2,
    ]);
    const r = analyzeSeries({
      data,
      noun: "la inflación",
      format: "percent",
    });
    expect(r).not.toBeNull();
    expect(r!.metrics.trend).toMatch(/decreciente|estable/);
  });

  it("detecta estabilidad", () => {
    const data: [string, number][] = Array.from({ length: 12 }, (_, i) => [
      `2024-${String(i + 1).padStart(2, "0")}-01`,
      100 + (i % 2 === 0 ? 0.5 : -0.5),
    ]);
    const r = analyzeSeries({ data, noun: "el indicador" });
    expect(r!.metrics.trend).toBe("estable");
  });

  it("calcula correctamente max y min", () => {
    const data: [string, number][] = [
      ["2024-01-01", 50],
      ["2024-02-01", 200], // max
      ["2024-03-01", 100],
      ["2024-04-01", 20], // min
      ["2024-05-01", 150],
    ];
    const r = analyzeSeries({ data, noun: "el dato" });
    expect(r!.metrics.max.value).toBe(200);
    expect(r!.metrics.max.date).toBe("2024-02-01");
    expect(r!.metrics.min.value).toBe(20);
    expect(r!.metrics.min.date).toBe("2024-04-01");
  });

  it("calcula variación interanual cuando hay 13+ puntos", () => {
    const data: [string, number][] = Array.from({ length: 14 }, (_, i) => [
      `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-01`,
      100 + i,
    ]);
    const r = analyzeSeries({ data, noun: "el indicador" });
    expect(r!.metrics.last12mChangePct).not.toBeNull();
    // De 100 (index 0) a 113 (index 13) son 13 puntos = 13%
    // Pero last12m compara con sorted[length-13] que es el valor 13 puntos atrás
    expect(r!.metrics.last12mChangePct).toBeCloseTo(12, 0);
  });

  it("incluye bullet de tendencia en el texto", () => {
    const data: [string, number][] = Array.from({ length: 6 }, (_, i) => [
      `2024-${String(i + 1).padStart(2, "0")}-01`,
      100 + i * 15,
    ]);
    const r = analyzeSeries({ data, noun: "el dólar" });
    expect(r!.text.toLowerCase()).toMatch(/alza|sub/);
  });

  it("usa la palabra 'creció' / 'cayó' al hablar del último año", () => {
    const dataGrew: [string, number][] = Array.from({ length: 14 }, (_, i) => [
      `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-01`,
      100 + i * 5,
    ]);
    const r = analyzeSeries({ data: dataGrew, noun: "el indicador" });
    expect(r!.text.toLowerCase()).toContain("creció");
  });

  it("formatea valores según hint", () => {
    const data: [string, number][] = Array.from({ length: 5 }, (_, i) => [
      `2024-${String(i + 1).padStart(2, "0")}-01`,
      1000 + i * 100,
    ]);
    const r = analyzeSeries({ data, noun: "X", format: "currency_ars" });
    expect(r!.text).toContain("$");
  });
});
