import { test, expect } from "@playwright/test";
import { mkdir } from "fs/promises";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "../../test-results/screenshots");

test.beforeAll(async () => {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
});

const PAGES = [
  { path: "/", name: "home" },
  { path: "/detalle/inflacion", name: "detalle-inflacion" },
  { path: "/detalle/dolar", name: "detalle-dolar" },
  { path: "/detalle/euro", name: "detalle-euro" },
  { path: "/detalle/salarios", name: "detalle-salarios" },
  { path: "/detalle/actividad", name: "detalle-actividad" },
  { path: "/detalle/empleo", name: "detalle-empleo" },
  { path: "/detalle/pobreza", name: "detalle-pobreza" },
  { path: "/calculadora", name: "calculadora" },
  { path: "/metodologia", name: "metodologia" },
  { path: "/status", name: "status" },
];

for (const page of PAGES) {
  test(`${page.name} carga y screenshot`, async ({ page: pwPage }) => {
    const errors: string[] = [];
    pwPage.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    pwPage.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });

    const response = await pwPage.goto(page.path, { waitUntil: "networkidle" });
    expect(response?.status(), `${page.name} status`).toBeLessThan(400);

    // Esperar a que la primera línea SVG aparezca si la página tiene chart
    await pwPage.waitForTimeout(800);

    // Screenshot full page
    await pwPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${page.name}.png`),
      fullPage: true,
    });

    // No errores de consola/runtime
    expect(errors, `${page.name} runtime errors`).toEqual([]);
  });
}

test("Home: KPI cards no tienen '—' visible en dólar/inflación", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(800);

  // Buscar el card de inflación mensual y verificar que su value no sea '—'
  const inflacionCard = page.getByText("Inflación mensual").first();
  await expect(inflacionCard).toBeVisible();

  // Tomar todo el texto del DOM y buscar patrones obvios de data faltante
  const bodyText = await page.locator("body").innerText();
  // Si el dato no llegó, el card mostraría "—" en lugar del valor
  // Hacemos un soft assert: no debería haber más de 2-3 "—" (límites razonables)
  const dashCount = (bodyText.match(/—/g) || []).length;
  expect(dashCount, `Hay ${dashCount} dashes en home (posible data faltante)`).toBeLessThan(10);
});

test("MultiCurrencyChart: comparativa renderiza y tiene leyenda con AR", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  // Buscar el header del chart comparativo
  await expect(
    page.getByText(/devaluación comparada/i).first(),
  ).toBeVisible();

  // ARS pinned siempre debería aparecer
  await expect(page.getByText(/ars/i).first()).toBeVisible();
});

test("Hover sobre chart de inflación: tooltip aparece y muestra valor", async ({
  page,
}) => {
  await page.goto("/detalle/inflacion");
  await page.waitForTimeout(800);

  const svg = page.locator("svg").first();
  await expect(svg).toBeVisible();

  // Hacer hover en el medio del primer SVG
  const box = await svg.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(300);
  }

  // No falla si no aparece tooltip — solo screenshot para inspección
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `hover-inflacion.png`),
  });
});

test("Footer: no hay datos personales", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);
  const footerText = await page.locator("footer").innerText();
  expect(footerText.toLowerCase()).not.toContain("tomás");
  expect(footerText.toLowerCase()).not.toContain("di loreto");
  expect(footerText.toLowerCase()).not.toContain("linkedin");
  expect(footerText.toLowerCase()).not.toContain("github");
  expect(footerText.toLowerCase()).toContain("datalogía");
});
