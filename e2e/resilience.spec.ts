import { expect, test } from "@playwright/test";

import { hydrated, signInViaApi, users } from "./fixtures";

test("the comparison recovers after the API fails", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("pricepilot:compare:v1", JSON.stringify(["sony-wh-1000xm4", "jbl-flip-5"])),
  );
  let fail = true;
  await page.route("**/api/products/compare**", (route) =>
    fail
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable" } }),
        })
      : route.continue(),
  );
  await page.goto("/compare");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Comparison didn't load");

  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("table", { name: "Product comparison: price" })).toContainText("WH-1000XM4");
});

test("the wishlist explains a failure and retries", async ({ page }) => {
  await signInViaApi(page, users.otherShopper);
  let fail = true;
  await page.route("**/api/wishlist", (route) =>
    fail ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : route.continue(),
  );
  await page.goto("/wishlist");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your wishlist didn't load");
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();
});

test("signing in while offline shows a useful message", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);
  await page.route("**/api/auth/login", (route) => route.abort("internetdisconnected"));
  await page.getByLabel("Email").fill(users.shopper.email);
  await page.getByLabel("Password", { exact: true }).fill(users.shopper.password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("offline");
});

test("a failed save rolls the heart back", async ({ page }) => {
  await signInViaApi(page, users.otherShopper);
  await page.route("**/api/wishlist/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable" } }),
    }),
  );
  await page.goto("/products/playstation-5");
  await hydrated(page);
  const heart = page.getByRole("button", { name: /Save PlayStation 5 Console to wishlist/ });
  await heart.click();
  await expect(page.getByText("Couldn't update your wishlist")).toBeVisible();
  await expect(heart).toHaveAttribute("aria-pressed", "false");
});
