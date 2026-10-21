import { expect, type Page } from "@playwright/test";

import testUsers from "./test-users.json";

type TestUser = { name: string; email: string; password: string };
export const users: Record<"admin" | "shopper" | "otherShopper", TestUser> = testUsers;

/** Sign in through the API (the session cookie lands in this page's context). */
export async function signInViaApi(page: Page, user: TestUser) {
  const res = await page.request.post("/api/auth/login", { data: { email: user.email, password: user.password } });
  expect(res.status()).toBe(200);
}

/** Pages hydrate after load; wait until client components are interactive. */
export async function hydrated(page: Page) {
  await page.waitForLoadState("networkidle");
}
