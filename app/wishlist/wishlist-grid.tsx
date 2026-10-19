"use client";

import { Heart, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { ProductGridSkeleton } from "@/components/listing/listing-skeleton";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { useProductsBySlugs } from "@/lib/catalog/use-products";
import { useHydrated } from "@/lib/use-hydrated";
import { useWishlist, wishlist } from "@/lib/wishlist";

const grid = "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6";

export function WishlistGrid() {
  const hydrated = useHydrated();
  const slugs = useWishlist();

  const { data, isPending, isError, isPlaceholderData, refetch } = useProductsBySlugs(slugs, hydrated);

  // The list lives on the device, so the server can't render it. Show a
  // skeleton (not a false "empty") until we've read it.
  if (!hydrated || (slugs.length > 0 && isPending)) {
    return (
      <div aria-busy="true" aria-label="Loading wishlist">
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (slugs.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Nothing saved yet"
        description="Tap the heart on any product to keep an eye on it."
        action={
          <Button asChild>
            <Link href="/products">Discover products</Link>
          </Button>
        }
      />
    );
  }

  if (isError && !data) {
    return (
      <ErrorState
        icon={<TriangleAlert />}
        title="Your saved products didn't load"
        description="Your list is safe on this device; we just couldn't fetch the product details."
        action={
          <Button onClick={() => refetch()}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    );
  }

  // Keep the user's order; drop rows still present only in placeholder data.
  const items = slugs.flatMap((s) => data?.find((i) => i.product.slug === s) ?? []);
  const missing = slugs.length - items.length;

  return (
    <>
      <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
        {slugs.length} {slugs.length === 1 ? "product" : "products"} saved. Tap a heart to remove; you can undo.
      </p>
      <ul className={grid}>
        {items.map((item) => (
          <li key={item.product.slug} className="flex">
            <ProductCard {...item} className="w-full" />
          </li>
        ))}
      </ul>
      {missing > 0 && !isPlaceholderData && (
        <p className="mt-8 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
          {missing} saved {missing === 1 ? "product is" : "products are"} no longer in the catalog.
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              const available = new Set(items.map((i) => i.product.slug));
              slugs.filter((s) => !available.has(s)).forEach((s) => wishlist.remove(s));
            }}
          >
            Remove from list
          </Button>
        </p>
      )}
    </>
  );
}
