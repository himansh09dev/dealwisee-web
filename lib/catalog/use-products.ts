"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProductsBySlugs, productKeys } from "./client";
import type { ProductWithInsight } from "./schema";

/**
 * Products for a client-held list of slugs (wishlist, comparison).
 *
 * Each product is cached under its own key, and the list query only fetches
 * slugs it hasn't seen: removing an item costs no request, adding one costs
 * a single small request instead of refetching the whole list.
 */
export function useProductsBySlugs(slugs: readonly string[], enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: productKeys.bySlugs(slugs),
    queryFn: async ({ signal }) => {
      const cached = (slug: string) => queryClient.getQueryData<ProductWithInsight>(productKeys.one(slug));
      const missing = slugs.filter((s) => !cached(s));
      if (missing.length > 0) {
        for (const item of await fetchProductsBySlugs(missing, signal)) {
          queryClient.setQueryData(productKeys.one(item.product.slug), item);
        }
      }
      return slugs.flatMap((s) => cached(s) ?? []);
    },
    enabled: enabled && slugs.length > 0,
    // Keep the previous list on screen while a changed list resolves.
    placeholderData: keepPreviousData,
  });
}
