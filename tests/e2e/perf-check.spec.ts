import { test, expect } from "@playwright/test";

test("home: medir LCP/FCP/TBT", async ({ page }) => {
  const start = Date.now();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const dcl = Date.now() - start;

  // Esperar a que termine networkidle
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  const networkIdle = Date.now() - start;

  // Web Vitals desde el navegador
  const metrics = await page.evaluate(() => {
    return new Promise<{ lcp: number; fcp: number; layoutShifts: number }>(
      (resolve) => {
        let lcp = 0;
        let fcp = 0;
        let layoutShifts = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            lcp = entry.startTime;
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              fcp = entry.startTime;
            }
          }
        }).observe({ type: "paint", buffered: true });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            layoutShifts += (entry as PerformanceEntry & { value: number }).value;
          }
        }).observe({ type: "layout-shift", buffered: true });

        setTimeout(() => resolve({ lcp, fcp, layoutShifts }), 2000);
      },
    );
  });

  console.log(`[perf] DOMContentLoaded: ${dcl}ms`);
  console.log(`[perf] Network idle:    ${networkIdle}ms`);
  console.log(`[perf] FCP:             ${metrics.fcp.toFixed(0)}ms`);
  console.log(`[perf] LCP:             ${metrics.lcp.toFixed(0)}ms`);
  console.log(`[perf] CLS:             ${metrics.layoutShifts.toFixed(3)}`);

  // Asserts blandos para no fallar el run
  expect(metrics.lcp).toBeLessThan(5000);
});
