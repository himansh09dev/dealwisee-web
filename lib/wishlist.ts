"use client";

import { productSchema } from "@pricepilot/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { clientApi } from "@/lib/api/client";
import { useSession } from "@/lib/auth/use-session";
import { withInsight, type ProductWithInsight } from "@/lib/catalog/schema";

/*
 * Account wishlist, stored by the API. Signed-out visitors have no wishlist
 * (we don't keep a local copy that could be mistaken for saved data).
 */

export const wishlistKey = ["wishlist"] as const;
const listResponse = z.object({ data: z.array(productSchema) });
const ackResponse = z.object({ data: z.object({ productId: z.string(), saved: z.boolean() }) });

export function useWishlist() {
  const { data: user } = useSession();
  return useQuery({
    queryKey: wishlistKey,
    queryFn: async ({ signal }) => (await clientApi("/wishlist", listResponse, { signal })).data.map(withInsight),
    enabled: Boolean(user),
  });
}

type Toggle = { item: ProductWithInsight; save: boolean };

/** Optimistic: the heart flips immediately and rolls back if the API refuses. */
export function useWishlistToggle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, save }: Toggle) =>
      clientApi(`/wishlist/${item.product.id}`, ackResponse, { method: save ? "POST" : "DELETE" }),
    onMutate: async ({ item, save }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKey });
      const previous = queryClient.getQueryData<ProductWithInsight[]>(wishlistKey);
      queryClient.setQueryData<ProductWithInsight[]>(wishlistKey, (old = []) => {
        const rest = old.filter((i) => i.product.id !== item.product.id);
        return save ? [item, ...rest] : rest;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => queryClient.setQueryData(wishlistKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
  });
}
