import "server-only";

import { categoryList, productListMetaSchema, productSchema, type Product } from "@pricepilot/contracts";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";

import { defaultQuery, toApiQuery, type ProductQuery } from "./query";
import { withInsight, type ProductWithInsight } from "./schema";

/*
 * Catalog reads for Server Components, backed by the Express API.
 *
 * Public catalog data is cached in Next's data cache for a few minutes
 * ('use cache' + cacheLife) and tagged, so admin mutations can expire it
 * immediately with updateTag(CATALOG_TAG). Callers run these at request
 * time (after connection()), so `next build` never needs the API running.
 */

export const CATALOG_TAG = "catalog";

const listResponse = z.object({ data: z.array(productSchema), meta: productListMetaSchema });
const oneResponse = z.object({ data: productSchema });

export type ProductPage = z.infer<typeof productListMetaSchema> & { items: ProductWithInsight[] };

export async function listProducts(query: ProductQuery): Promise<ProductPage> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  const { data, meta } = await serverApi(`/products?${toApiQuery(query)}`, listResponse);
  return { ...meta, items: data.map(withInsight) };
}

/** null when the product doesn't exist (so pages can call notFound()). */
export async function getProduct(slug: string): Promise<ProductWithInsight | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  try {
    const { data } = await serverApi(`/products/${encodeURIComponent(slug)}`, oneResponse);
    return withInsight(data);
  } catch (err) {
    if (isApiError(err, 404) || isApiError(err, 400)) return null;
    throw err;
  }
}

/**
 * Same category first, then other products closest in price. The second
 * query asks only for a small price window (60–150% of this price) instead
 * of the catalog, so a product page fetches ~9 candidates, not 48.
 */
export async function getRelatedProducts(product: Product, limit: number) {
  const dollars = product.currentPrice / 100;
  const [sameCategory, nearby] = await Promise.all([
    listProducts({ ...defaultQuery, categories: [product.category], pageSize: limit + 1 }),
    listProducts({
      ...defaultQuery,
      sort: "price-asc",
      minPrice: Math.floor(dollars * 0.6),
      maxPrice: Math.ceil(dollars * 1.5),
      pageSize: limit * 2 + 1,
    }),
  ]);
  const picked = sameCategory.items.filter((i) => i.product.slug !== product.slug);
  const distance = (p: Product) => Math.abs(p.currentPrice - product.currentPrice);
  const rest = nearby.items
    .filter((i) => i.product.slug !== product.slug && i.product.category !== product.category)
    .sort((a, b) => distance(a.product) - distance(b.product));
  return [...picked, ...rest].slice(0, limit);
}

export type CategorySummary = { id: string; name: string; count: number; cover: Product["image"] };

/** One small cached request per category: its count and newest product's photo. */
export async function getCategorySummaries(): Promise<CategorySummary[]> {
  const pages = await Promise.all(
    categoryList.map((c) => listProducts({ ...defaultQuery, categories: [c.id], pageSize: 1 })),
  );
  return categoryList.flatMap((c, i) => {
    const page = pages[i];
    const cover = page?.items[0]?.product.image;
    return page && cover ? [{ ...c, count: page.total, cover }] : [];
  });
}
