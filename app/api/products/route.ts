import type { NextRequest } from "next/server";

import { catalog } from "@/lib/catalog";
import { parseProductQuery } from "@/lib/catalog/query";
import { slugSchema } from "@/lib/catalog/schema";

/*
 * Read-only JSON endpoint for client components (wishlist, compare picker).
 * A thin backend-for-frontend over the catalog repository; when the Express
 * API exists this can proxy to it or be removed in favour of direct calls.
 *
 *   GET /api/products?slugs=a,b,c   → { items }   (max 24, order preserved)
 *   GET /api/products?q=…&sort=…    → ProductPage (same params as /products,
 *                                    plus optional limit=1–50 for pickers)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slugsParam = params.get("slugs");

  if (slugsParam !== null) {
    const slugs = slugsParam
      .split(",")
      .filter((s) => slugSchema.safeParse(s).success)
      .slice(0, 24);
    const items = await catalog.getProductsBySlugs(slugs);
    return Response.json({ items });
  }

  const raw: Record<string, string[]> = {};
  for (const [key, value] of params) (raw[key] ??= []).push(value);
  const query = parseProductQuery(raw);
  const limit = Number(params.get("limit"));
  if (Number.isInteger(limit) && limit >= 1 && limit <= 50) query.pageSize = limit;
  return Response.json(await catalog.listProducts(query));
}
