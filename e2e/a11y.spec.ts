import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { hydrated, signInViaApi, users } from "./fixtures";

/*
 * Automated WCAG 2.2 A/AA checks with axe-core on every main page, in light
 * and dark color schemes. Automated tools catch roughly a third of issues;
 * keyboard flows are covered in the other specs.
 */

const pages = [
  "/",
  "/products",
  "/products?q=zzzz",
  "/products/sony-wh-1000xm4",
  "/compare",
  "/wishlist",
  "/login",
  "/register",
];

for (const scheme of ["light", "dark"] as const) {
  for (const path of pages) {
    test(`no WCAG A/AA violations on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(path);
      await hydrated(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.help}`);
      expect(summary).toEqual([]);
    });
  }
}

test("no WCAG A/AA violations on the admin dashboard", async ({ page }) => {
  await signInViaApi(page, users.admin);
  await page.goto("/admin/products");
  await hydrated(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("reduced-motion users get no animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/products");
  const duration = await page.evaluate(() => {
    const el = document.querySelector("[data-slot='skeleton']") ?? document.body;
    return getComputedStyle(el).animationDuration;
  });
  expect(["0s", "1e-05s", "0.00001s"]).toContain(duration);
});
