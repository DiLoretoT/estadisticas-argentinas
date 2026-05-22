/**
 * UI audit completo: screenshots de todas las páginas en desktop y mobile,
 * captura de console errors, verificación de elementos clave.
 */

import { test, expect, type Page } from "@playwright/test";
import path from "path";

const OUT_DIR = path.join("test-results", "ui-audit");

interface PageDef {
  slug: string;
  url: string;
  expectedText?: string;
}

const PAGES: PageDef[] = [
  { slug: "home", url: "/", expectedText: "Argentina" },
  { slug: "explorar", url: "/explorar", expectedText: "Explorar" },
  { slug: "analisis", url: "/analisis", expectedText: "Análisis" },
  { slug: "comparativa", url: "/comparativa", expectedText: "LATAM" },
  { slug: "mapa", url: "/mapa", expectedText: "Mapa" },
  { slug: "provincia-buenos-aires", url: "/provincia/buenos-aires" },
  { slug: "provincia-neuquen", url: "/provincia/neuquen" },
  { slug: "provincia-formosa", url: "/provincia/formosa" },
  { slug: "calendario", url: "/calendario", expectedText: "Calendario" },
  { slug: "calculadora", url: "/calculadora", expectedText: "Calculadora" },
  { slug: "metodologia", url: "/metodologia", expectedText: "Metodología" },
  { slug: "status", url: "/status" },
  { slug: "detalle-dolar", url: "/detalle/dolar" },
  { slug: "detalle-inflacion", url: "/detalle/inflacion" },
  { slug: "detalle-empleo", url: "/detalle/empleo" },
];

async function captureConsole(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      messages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    messages.push(`[pageerror] ${err.message}`);
  });
  return messages;
}

test.describe("UI audit desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const p of PAGES) {
    test(`desktop ${p.slug}`, async ({ page }) => {
      const errors = await captureConsole(page);
      const res = await page.goto(p.url, { waitUntil: "networkidle", timeout: 30000 });
      expect(res?.status()).toBeLessThan(400);

      if (p.expectedText) {
        await expect(page.locator("body")).toContainText(p.expectedText, { timeout: 10000 });
      }

      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(OUT_DIR, "desktop", `${p.slug}.png`),
        fullPage: true,
      });

      if (errors.length > 0) {
        console.log(`[${p.slug}] errors:`, errors);
      }
    });
  }
});

test.describe("UI audit mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const p of PAGES) {
    test(`mobile ${p.slug}`, async ({ page }) => {
      const res = await page.goto(p.url, { waitUntil: "networkidle", timeout: 30000 });
      expect(res?.status()).toBeLessThan(400);

      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(OUT_DIR, "mobile", `${p.slug}.png`),
        fullPage: true,
      });
    });
  }
});
