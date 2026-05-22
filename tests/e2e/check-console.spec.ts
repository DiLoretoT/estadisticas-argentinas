import { test } from "@playwright/test";

test("home: log all console messages + errors", async ({ page }) => {
  const messages: string[] = [];

  page.on("console", (msg) => {
    messages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    messages.push(`[pageerror] ${err.message}`);
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("=== Browser console messages ===");
  messages.forEach((m) => console.log(m));
});
