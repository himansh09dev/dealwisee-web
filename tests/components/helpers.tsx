import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import type { Product, PublicUser } from "@/lib/catalog/schema";
import { withInsight } from "@/lib/catalog/schema";

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Route = (url: string, init?: RequestInit) => Response | Promise<Response> | undefined;

/** Stubs global fetch with a small router; unmatched requests fail the test loudly. */
export function stubApi(route: Route) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const res = await route(url, init);
    if (!res) throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url}`);
    return res;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export const shopper: PublicUser = { id: "u1", name: "Ana", email: "ana@example.test", role: "user" };

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "0123456789abcdef01234567",
    slug: "test-speaker",
    name: "Test Speaker",
    brand: "Acme",
    category: "audio",
    summary: "Waterproof · 12 h",
    description: "A speaker.",
    image: { url: "/images/products/jbl-flip-5.jpg", alt: "A black speaker" },
    listPrice: 12999,
    offers: [
      { storeId: "voltmart", storeName: "Voltmart", price: 8999, shipping: 0, inStock: true },
      { storeId: "parcel", storeName: "Parcel & Co.", price: 9499, shipping: 0, inStock: true },
    ],
    history: [11999, 10999, 9999],
    specs: [],
    currentPrice: 8999,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

export const item = (overrides: Partial<Product> = {}) => withInsight(makeProduct(overrides));
