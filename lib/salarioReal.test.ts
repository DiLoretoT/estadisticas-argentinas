import { describe, it, expect } from "vitest";
import { computeSalarioReal } from "./salarioReal";

describe("computeSalarioReal", () => {
  it("retorna [] cuando alguna serie está vacía", () => {
    expect(computeSalarioReal([], [["2024-01-01", 0.02]])).toEqual([]);
    expect(computeSalarioReal([["2024-01-01", 100]], [])).toEqual([]);
  });

  it("base 100 en el primer mes común", () => {
    const ripte: [string, number][] = [
      ["2024-01-01", 100],
      ["2024-02-01", 110],
      ["2024-03-01", 121],
    ];
    const ipc: [string, number][] = [
      ["2024-01-01", 0.1], // ipc index: 100, 110, 121
      ["2024-02-01", 0.1],
      ["2024-03-01", 0.1],
    ];
    const real = computeSalarioReal(ripte, ipc);
    expect(real.length).toBeGreaterThan(0);
    // El primer punto siempre es 100
    expect(real[0][1]).toBeCloseTo(100, 1);
  });

  it("cuando salarios crecen igual que IPC, el real queda en 100", () => {
    const ripte: [string, number][] = [
      ["2024-01-01", 1000],
      ["2024-02-01", 1100],
      ["2024-03-01", 1210],
    ];
    const ipc: [string, number][] = [
      ["2024-01-01", 0.1],
      ["2024-02-01", 0.1],
      ["2024-03-01", 0.1],
    ];
    const real = computeSalarioReal(ripte, ipc);
    real.forEach(([, v]) => {
      expect(v).toBeCloseTo(100, 0);
    });
  });

  it("cuando IPC sube más rápido que salario, el real cae", () => {
    const ripte: [string, number][] = [
      ["2024-01-01", 1000],
      ["2024-02-01", 1050], // +5%
      ["2024-03-01", 1100], // +~5%
    ];
    const ipc: [string, number][] = [
      ["2024-01-01", 0.1], // index: 100, 110, 121
      ["2024-02-01", 0.1],
      ["2024-03-01", 0.1],
    ];
    const real = computeSalarioReal(ripte, ipc);
    expect(real[0][1]).toBeCloseTo(100);
    // El último valor debe ser menor (poder adquisitivo cayó)
    expect(real[real.length - 1][1]).toBeLessThan(100);
  });
});
