import { test, expect } from "@playwright/test";
import path from "path";

test("mapa: screenshot + verificar provincias renderizadas", async ({ page }) => {
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Esperar a que el SVG del mapa aparezca
  await expect(page.locator("svg path").first()).toBeVisible({ timeout: 10000 });

  // Contar paths (deberían ser 24 provincias)
  const pathCount = await page.locator("svg path").count();
  console.log(`[mapa] SVG paths renderizados: ${pathCount}`);
  expect(pathCount).toBeGreaterThanOrEqual(20);

  // Screenshot
  await page.screenshot({
    path: path.join("test-results", "screenshots", "mapa.png"),
    fullPage: true,
  });
});
