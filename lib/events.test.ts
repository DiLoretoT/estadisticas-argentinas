import { describe, it, expect } from "vitest";
import { filterEventsForSeries, type EconomicEvent } from "./events";

const fixtureEvents: EconomicEvent[] = [
  {
    date: "2019-08-11",
    label: "PASO 2019",
    description: "Resultado inesperado",
    category: "politica",
    applies_to: ["all", "dolar_oficial"],
  },
  {
    date: "2023-12-13",
    label: "Devaluación Milei",
    description: "118%",
    category: "devaluacion",
    applies_to: ["all", "dolar_oficial", "ipc"],
  },
  {
    date: "2020-03-20",
    label: "Cuarentena COVID",
    description: "ASPO",
    category: "crisis",
    applies_to: ["emae", "pbi"],
  },
];

const fixtureData: [string, number][] = [
  ["2019-01-01", 100],
  ["2025-01-01", 200],
];

describe("filterEventsForSeries", () => {
  it("retorna [] cuando la data está vacía", () => {
    expect(filterEventsForSeries(fixtureEvents, "ipc", [])).toEqual([]);
  });

  it("incluye eventos con tag 'all'", () => {
    const result = filterEventsForSeries(fixtureEvents, "cualquier", fixtureData);
    expect(result.map((e) => e.label)).toContain("PASO 2019");
    expect(result.map((e) => e.label)).toContain("Devaluación Milei");
  });

  it("incluye eventos cuyo applies_to contiene el tag pedido", () => {
    const result = filterEventsForSeries(fixtureEvents, "ipc", fixtureData);
    expect(result.map((e) => e.label)).toContain("Devaluación Milei");
  });

  it("excluye eventos que no aplican al tag", () => {
    const result = filterEventsForSeries(fixtureEvents, "ipc", fixtureData);
    expect(result.map((e) => e.label)).not.toContain("Cuarentena COVID");
  });

  it("filtra eventos fuera del rango de fechas de la data", () => {
    const narrowData: [string, number][] = [
      ["2024-01-01", 100],
      ["2024-12-31", 200],
    ];
    const result = filterEventsForSeries(fixtureEvents, "all", narrowData);
    expect(result).toEqual([]);
  });

  it("incluye eventos en el borde del rango", () => {
    const data: [string, number][] = [
      ["2019-08-11", 100],
      ["2025-01-01", 200],
    ];
    const result = filterEventsForSeries(fixtureEvents, "all", data);
    expect(result.map((e) => e.label)).toContain("PASO 2019");
  });
});
