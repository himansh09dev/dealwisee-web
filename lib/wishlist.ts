"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toaster";
import { clientApi } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/use-session";
import { withInsight, type ProductWithInsight } from "@/lib/catalog/schema";

/*
 * Account wishlist, stored by the API. Signed-out visitors have no wishlist
 * (we don't keep a local copy that could be mistaken for saved data).
 */

export const wishlistKey = ["wishlist"] as const;

/**
 * The full product schema is loaded on demand: the header uses this hook on
 * every page, but only signed-in users ever fetch a wishlist.
 */
async function listParser() {
  // Named imports inside a small module keep this chunk tree-shaken.
  return (await import("./wishlist-schema")).wishlistResponse;
}

const ackResponse = {
  parse(body: unknown) {
    const data = typeof body === "object" && body !== null && "data" in body ? body.data : undefined;
    if (typeof data !== "object" || data === null) throw new Error("Unexpected wishlist response");
    return data;
  },
};

async function fetchWishlist({ signal }: { signal: AbortSignal }) {
  return (await clientApi("/wishlist", await listParser(), { signal })).data.map(withInsight);
}

export function useWishlist() {
  const { data: user } = useSession();
  return useQuery({ queryKey: wishlistKey, queryFn: fetchWishlist, enabled: Boolean(user) });
}

/**
 * Whether one product is saved, and whether that's known yet. Each heart
 * subscribes only to its own boolean (TanStack `select` + `notifyOnChangeProps`),
 * so toggling one product re-renders one heart, not every card on the page.
 */
export function useIsSaved(productId: string) {
  const { data: user } = useSession();
  const { data, isSuccess } = useQuery({
    queryKey: wishlistKey,
    queryFn: fetchWishlist,
    enabled: Boolean(user),
    select: (items) => items.some((i) => i.product.id === productId),
    notifyOnChangeProps: ["data", "isSuccess"],
  });
  return { saved: data ?? false, known: isSuccess };
}

/** Number of saved products, for the header badge. */
export function useWishlistCount() {
  const { data: user } = useSession();
  return (
    useQuery({
      queryKey: wishlistKey,
      queryFn: fetchWishlist,
      enabled: Boolean(user),
      select: (items) => items.length,
      notifyOnChangeProps: ["data"],
    }).data ?? 0
  );
}

type Toggle = { item: ProductWithInsight; save: boolean };

/**
 * Optimistic: the heart flips immediately and rolls back if the API refuses.
 * Error reporting lives here, not in per-call callbacks: removing an item on
 * the wishlist page unmounts its card (and button) before the request ends,
 * and TanStack skips per-call callbacks for unmounted components.
 */
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
    onError: (err, _vars, context) => {
      queryClient.setQueryData(wishlistKey, context?.previous);
      // 401s are handled globally (session expired); everything else is reported here.
      if (!isApiError(err, 401)) toast("Couldn't update your wishlist", { description: err.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
  });
}
