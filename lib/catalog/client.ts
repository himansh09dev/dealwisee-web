import { z } from "zod";

import { categoryIdSchema, productWithInsightSchema } from "./schema";

/*
 * Browser-side fetchers. Responses are parsed with the shared schemas so a
 * contract change fails loudly here instead of rendering `undefined`.
 */

const itemsSchema = z.object({ items: z.array(productWithInsightSchema) });

const facetSchema = z.object({ value: z.string(), label: z.string(), count: z.number() });
const productPageSchema = z.object({
  items: z.array(productWithInsightSchema),
  total: z.number(),
  page: z.number(),
  pageCount: z.number(),
  pageSize: z.number(),
  facets: z.object({
    categories: z.array(facetSchema.extend({ value: categoryIdSchema })),
    brands: z.array(facetSchema),
  }),
});

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export async function fetchProductsBySlugs(slugs: readonly string[], signal?: AbortSignal) {
  if (slugs.length === 0) return [];
  const data = await getJson(`/api/products?slugs=${slugs.map(encodeURIComponent).join(",")}`, signal);
  return itemsSchema.parse(data).items;
}

export async function searchProducts(q: string, signal?: AbortSignal) {
  const data = await getJson(`/api/products?sort=name-asc&limit=24&q=${encodeURIComponent(q)}`, signal);
  return productPageSchema.parse(data);
}

export const productKeys = {
  one: (slug: string) => ["products", "one", slug] as const,
  bySlugs: (slugs: readonly string[]) => ["products", "by-slugs", [...slugs]] as const,
  search: (q: string) => ["products", "search", q] as const,
};
