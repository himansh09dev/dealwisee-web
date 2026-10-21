import { expect, test } from "@playwright/test";

import { hydrated } from "./fixtures";

const count = (page: import("@playwright/test").Page) => page.getByText(/^Showing \d+–\d+ of \d+ products?$|^No products$/);

test("search, filter, sort and paginate, with state in the URL", async ({ page }) => {
  await page.goto("/products");
  await hydrated(page);
  await expect(count(page)).toHaveText("Showing 1–12 of 13 products");

  // Search (debounced): the URL updates once typing pauses.
  await page.getByRole("searchbox", { name: "Search products" }).last().fill("sony");
  await expect(page).toHaveURL(/q=sony/);
  await expect(count(page)).toHaveText("Showing 1–2 of 2 products");

  // Filter by category on top of the search.
  await page.getByRole("checkbox", { name: /Audio/ }).click();
  await expect(page).toHaveURL(/q=sony&category=audio/);
  await expect(count(page)).toHaveText("Showing 1–1 of 1 product");
  await expect(page.getByRole("group", { name: "Active filters" })).toContainText("Audio");

  // Clear everything.
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(count(page)).toHaveText("Showing 1–12 of 13 products");

  // Sort by price, high to low.
  await page.getByRole("combobox", { name: "Sort" }).click();
  await page.getByRole("option", { name: "Price: high to low" }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.getByRole("article").first()).toContainText("MacBook Pro");

  // Paginate, keeping the sort.
  await page.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/sort=price-desc&page=2/);
  await expect(count(page)).toHaveText("Showing 13–13 of 13 products");

  // Back returns to page 1 (pagination uses real links).
  await page.goBack();
  await expect(count(page)).toHaveText("Showing 1–12 of 13 products");
});

test("a search with no results offers a way out", async ({ page }) => {
  await page.goto("/products?q=zzzz");
  await expect(page.getByRole("heading", { name: "No results for “zzzz”" })).toBeVisible();
  await hydrated(page);
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("mobile filters open in a sheet and show the live result count @mobile", async ({ page }) => {
  await page.goto("/products");
  await hydrated(page);
  await page.getByRole("button", { name: /Filters/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await sheet.getByRole("checkbox", { name: /Footwear/ }).click();
  await expect(sheet.getByRole("button", { name: "Show 2 results" })).toBeVisible();
  await sheet.getByRole("button", { name: "Show 2 results" }).click();
  await expect(page).toHaveURL(/category=footwear/);
});
