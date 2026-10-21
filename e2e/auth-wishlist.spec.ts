import { expect, test } from "@playwright/test";

import { hydrated, signInViaApi, users } from "./fixtures";

test("sign in, save to the wishlist, survive a reload, undo a removal, sign out", async ({ page }) => {
  await page.goto("/products/jbl-flip-5");
  await hydrated(page);
  // Signed out: saving asks you to sign in.
  await page.getByRole("button", { name: /Save Flip 5 .* to wishlist/ }).click();
  await expect(page.getByText("Sign in to save products")).toBeVisible();

  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await hydrated(page);
  await page.getByLabel("Email").fill(users.shopper.email);
  await page.getByLabel("Password", { exact: true }).fill(users.shopper.password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  // Shoppers return to where they were.
  await expect(page).toHaveURL(/\/products\/jbl-flip-5$/);
  await hydrated(page);

  const heart = page.getByRole("button", { name: /Save Flip 5 .* to wishlist/ });
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Saved to your wishlist")).toBeVisible();

  await page.goto("/wishlist");
  await expect(page.getByRole("link", { name: "Flip 5 Portable Waterproof Speaker" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Flip 5 Portable Waterproof Speaker" })).toBeVisible();

  // Remove, then undo.
  await hydrated(page);
  await page.getByRole("button", { name: /Save Flip 5 .* to wishlist/ }).click();
  await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("link", { name: "Flip 5 Portable Waterproof Speaker" })).toBeVisible();

  // Sign out from the account menu.
  await page.getByRole("button", { name: users.shopper.name }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to see your wishlist" })).toBeVisible();
});

test("another shopper never sees someone else's wishlist", async ({ page }) => {
  await signInViaApi(page, users.otherShopper);
  await page.goto("/wishlist");
  await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();
});

test("wrong passwords get a clear message and no session", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);
  await page.getByLabel("Email").fill(users.shopper.email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password-1");
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Email or password is incorrect");
  const me = await page.request.get("/api/auth/me");
  expect((await me.json()).data.user).toBeNull();
});
