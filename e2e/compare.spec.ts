import { expect, test } from "@playwright/test";

import { hydrated } from "./fixtures";

test("compare products, replace one, and respect the three-product limit", async ({ page }) => {
  for (const slug of ["sony-wh-1000xm4", "jbl-flip-5", "apple-watch-series-6"]) {
    await page.goto(`/products/${slug}`);
    await hydrated(page);
    await page.getByRole("button", { name: "Compare", exact: true }).click();
    await expect(page.getByRole("button", { name: "In comparison" })).toBeVisible();
  }

  // A fourth is refused with an explanation.
  await page.goto("/products/playstation-5");
  await hydrated(page);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByText("Comparison holds up to 3 products")).toBeVisible();

  await page.getByRole("region", { name: "Comparison" }).getByRole("link", { name: "Compare" }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const table = page.getByRole("table", { name: "Product comparison: price" });
  await expect(table.getByRole("columnheader")).toHaveCount(4); // label column + 3 products
  await expect(page.getByText("3 of 3 selected")).toBeVisible();
  await expect(table.getByText("Lowest", { exact: true })).toBeVisible();

  // Replace the watch with the PlayStation via the picker.
  await page.getByRole("button", { name: /Replace Watch Series 6/ }).click();
  const picker = page.getByRole("dialog", { name: /Replace/ });
  await picker.getByRole("searchbox").fill("playstation");
  await picker.getByRole("button", { name: "Choose PlayStation 5 Console" }).click();
  await expect(table).toContainText("PlayStation 5 Console");
  await expect(table).not.toContainText("Watch Series 6");

  // Remove one; the empty slot offers "Add product".
  await page.getByRole("button", { name: /Remove Flip 5/ }).click();
  await expect(page.getByText("2 of 3 selected")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add product" })).toBeVisible();
});
