import { test } from "@playwright/test";

/**
 * Test diagnóstico — inspecciona el DOM del home para detectar qué hay y qué falta.
 */
test("home: dump KPI cards y estructura", async ({ page }) => {
  await page.goto("/");
  // Force animations to finish
  await page.waitForTimeout(2500);

  // ¿Cuántos KpiCard hay en el DOM?
  const kpiTexts = await page
    .locator(".rounded-xl.p-4.border")
    .allInnerTexts();
  console.log("=== KPI Cards encontrados:", kpiTexts.length);
  kpiTexts.forEach((t, i) =>
    console.log(`  [${i}] ${t.replace(/\n/g, " | ").slice(0, 120)}`),
  );

  // ¿Cuántos charts SVG hay?
  const svgs = await page.locator("svg").count();
  console.log("=== SVGs en DOM:", svgs);

  // Section headers visibles
  const headers = await page.locator("h2").allInnerTexts();
  console.log("=== Section headers:", headers);

  // Capturar también el HTML del primer "Dólar en Argentina" section
  const dolarSection = await page
    .locator("section#monedas")
    .innerHTML()
    .catch(() => "(no encontró #monedas)");
  console.log(
    "=== #monedas HTML primeros 1000 chars:",
    dolarSection.slice(0, 1000),
  );

  // Screenshot full
  await page.screenshot({
    path: "test-results/screenshots/home-debug.png",
    fullPage: true,
  });
});
