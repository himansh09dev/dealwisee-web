import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, vi } from "vitest";

/*
 * Test doubles for framework edges only. Our own components, hooks, stores
 * and TanStack Query run for real; network calls go to a stubbed fetch.
 */

import { router } from "./doubles";

vi.mock("next/navigation", async () => {
  const { router: r } = await import("./doubles");
  return { useRouter: () => r, usePathname: () => r.pathname, useSearchParams: () => r.searchParams };
});

vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _p, ...rest }: { href: string; children: ReactNode; prefetch?: boolean }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ fill: _f, priority: _p, alt, ...rest }: ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
    <img alt={alt ?? ""} {...rest} />
  ),
}));

vi.mock("@/components/ui/toaster", async () => {
  const { toastSpy } = await import("./doubles");
  return { toast: toastSpy, Toaster: () => null };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  router.pathname = "/products";
  router.searchParams = new URLSearchParams();
});
