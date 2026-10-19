"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state";
import type { ProductWithInsight } from "@/lib/catalog/queries";
import { useHydrated } from "@/lib/use-hydrated";
import { useWishlist } from "@/lib/wishlist";

const grid = "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6";

export function WishlistGrid({ catalog }: { catalog: ProductWithInsight[] }) {
  const hydrated = useHydrated();
  const slugs = useWishlist();

  // The list lives in localStorage, so the server can't know it: show a skeleton, not a false "empty".
  if (!hydrated) {
    return (
      <div aria-busy="true" aria-label="Loading wishlist" className={grid}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="mt-4 h-3 w-1/3" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-5 h-5 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const bySlug = new Map(catalog.map((item) => [item.product.slug, item]));
  const items = slugs.flatMap((slug) => bySlug.get(slug) ?? []);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="Nothing saved yet"
        description="Tap the heart on any product to keep an eye on it. Your list stays on this device."
        action={
          <Button asChild>
            <Link href="/">Discover products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
        {items.length} {items.length === 1 ? "product" : "products"} saved
      </p>
      <ul className={grid}>
        {items.map((item) => (
          <li key={item.product.slug} className="flex">
            <ProductCard {...item} className="w-full" />
          </li>
        ))}
      </ul>
    </>
  );
}
