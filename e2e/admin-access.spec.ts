import { expect, test } from "@playwright/test";

import { hydrated, signInViaApi, users } from "./fixtures";

const anyProductId = async (page: import("@playwright/test").Page) => {
  const res = await page.request.get("/api/products/jbl-flip-5");
  return (await res.json()).data.id as string;
};

test("signed-out visitors are sent to sign in, and the API refuses them", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fproducts|\/login\?next=\/admin\/products/);

  const id = await anyProductId(page);
  const del = await page.request.delete(`/api/admin/products/${id}`);
  expect(del.status()).toBe(401);
  const create = await page.request.post("/api/admin/products", { data: { slug: "x" } });
  expect(create.status()).toBe(401);
});

test("shoppers see 'no access' and every admin endpoint returns 403", async ({ page }) => {
  await signInViaApi(page, users.shopper);
  await page.goto("/admin/products");
  await expect(page.getByRole("heading", { name: "You don't have access to admin tools" })).toBeVisible();

  const id = await anyProductId(page);
  expect((await page.request.delete(`/api/admin/products/${id}`)).status()).toBe(403);
  expect((await page.request.patch(`/api/admin/products/${id}`, { data: { name: "Hacked" } })).status()).toBe(403);
  expect((await page.request.post("/api/admin/products", { data: { slug: "x" } })).status()).toBe(403);

  // The product is untouched.
  const after = await page.request.get("/api/products/jbl-flip-5");
  expect((await after.json()).data.name).toBe("Flip 5 Portable Waterproof Speaker");
});

test("cross-site requests are blocked even with a valid admin session", async ({ page }) => {
  await signInViaApi(page, users.admin);
  const id = await anyProductId(page);
  const res = await page.request.delete(`/api/admin/products/${id}`, { headers: { Origin: "https://evil.example" } });
  expect(res.status()).toBe(403);
  expect((await page.request.get("/api/products/jbl-flip-5")).status()).toBe(200);
});

test("admins reach the dashboard after signing in", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);
  await page.getByLabel("Email").fill(users.admin.email);
  await page.getByLabel("Password", { exact: true }).fill(users.admin.password);
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByRole("table", { name: "Products in the catalog" })).toBeVisible();
});
