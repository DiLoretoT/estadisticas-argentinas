import { describe, it, expect } from "vitest";
import { COMPARATIVAS, validateAgainstCatalog, comparativasFor, groupComparativas } from "./comparativas";
import { SERIES_CATALOG } from "./seriesCatalog";

describe("Comparativas catalog", () => {
  it("todas las xId/yId existen en SERIES_CATALOG", () => {
    const errors = validateAgainstCatalog(SERIES_CATALOG);
    expect(errors).toEqual([]);
  });

  it("cada comparativa tiene los campos obligatorios", () => {
    for (const c of COMPARATIVAS) {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.question).toBeTruthy();
      expect(c.interpretation).toBeTruthy();
      expect(c.coefReason).toBeTruthy();
      expect(["pearson", "spearman", "kendall"]).toContain(c.coef);
    }
  });

  it("xId != yId en cada comparativa", () => {
    for (const c of COMPARATIVAS) {
      expect(c.xId).not.toBe(c.yId);
    }
  });

  it("ids son únicos", () => {
    const ids = COMPARATIVAS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("comparativasFor encuentra comparativas con la serie dada", () => {
    const list = comparativasFor("ipc_mensual");
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect([c.xId, c.yId]).toContain("ipc_mensual");
    }
  });

  it("groupComparativas distribuye correctamente", () => {
    const grouped = groupComparativas();
    const totalInGroups = Object.values(grouped).reduce((sum, list) => sum + list.length, 0);
    expect(totalInGroups).toBe(COMPARATIVAS.length);
  });
});
