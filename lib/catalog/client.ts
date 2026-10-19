import { productListMetaSchema, productSchema } from "@pricepilot/contracts";
import { z } from "zod";

import { clientApi } from "@/lib/api/client";

import { withInsight } from "./schema";

/* Browser-side catalog reads (compare page, product picker). */

const compareResponse = z.object({
  data: z.array(productSchema),
  meta: z.object({ missing: z.array(z.string()) }),
});
const listResponse = z.object({ data: z.array(productSchema), meta: productListMetaSchema });

export async function fetchProductsBySlugs(slugs: readonly string[], signal?: AbortSignal) {
  if (slugs.length === 0) return [];
  const { data } = await clientApi(`/products/compare?slugs=${slugs.map(encodeURIComponent).join(",")}`, compareResponse, {
    signal,
  });
  return data.map(withInsight);
}

export async function searchProducts(q: string, signal?: AbortSignal) {
  const { data, meta } = await clientApi(
    `/products?sort=name-asc&pageSize=24&q=${encodeURIComponent(q)}`,
    listResponse,
    { signal },
  );
  return { ...meta, items: data.map(withInsight) };
}

export const productKeys = {
  one: (slug: string) => ["products", "one", slug] as const,
  bySlugs: (slugs: readonly string[]) => ["products", "by-slugs", [...slugs]] as const,
  search: (q: string) => ["products", "search", q] as const,
};
