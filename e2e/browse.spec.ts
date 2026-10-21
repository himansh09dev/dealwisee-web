import { expect, test } from "@playwright/test";

import { hydrated } from "./fixtures";

test("browse from the homepage to a product's details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Pay the right price/ })).toBeVisible();

  // Open a product from the "Worth a look" grid.
  const card = page.getByRole("article").filter({ hasText: "Flip 5 Portable Waterproof Speaker" }).first();
  await card.getByRole("link", { name: "Flip 5 Portable Waterproof Speaker" }).click();

  await expect(page).toHaveURL(/\/products\/jbl-flip-5$/);
  await expect(page.getByRole("heading", { level: 1, name: "Flip 5 Portable Waterproof Speaker" })).toBeVisible();
  await expect(page.getByRole("table", { name: /Offers for/ })).toContainText("Voltmart");
  await expect(page.getByRole("heading", { name: "Specifications" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "You might also compare" })).toBeVisible();
  await expect(page).toHaveTitle(/JBL Flip 5/);
});

test("unknown products show a helpful not-found page", async ({ page }) => {
  await page.goto("/products/does-not-exist");
  await expect(page.getByRole("heading", { name: "This product isn't in the catalog" })).toBeVisible();
  await page.getByRole("link", { name: "Browse all products" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("keyboard users can skip to content and open the image viewer", async ({ page }) => {
  await page.goto("/products/sony-wh-1000xm4");
  await hydrated(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();

  await page.getByRole("button", { name: "Enlarge" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Enlarge" })).toBeFocused();
});
