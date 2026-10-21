import { vi } from "vitest";

/** Shared test doubles for Next's router and the toast function. */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  pathname: "/products",
  searchParams: new URLSearchParams(),
};
export const toastSpy = vi.fn();
