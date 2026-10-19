"use client";

import { Heart, LogIn, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { ProductGridSkeleton } from "@/components/listing/listing-skeleton";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { useSession } from "@/lib/auth/use-session";
import { useWishlist } from "@/lib/wishlist";

const grid = "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6";

function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading wishlist">
      <ProductGridSkeleton count={4} />
    </div>
  );
}

export function WishlistGrid() {
  const session = useSession();
  const wishlist = useWishlist();

  if (session.isPending) return <Loading />;

  if (session.isError) {
    return (
      <ErrorState
        icon={<TriangleAlert />}
        title="We couldn't check your account"
        description={session.error.message}
        action={
          <Button onClick={() => session.refetch()}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    );
  }

  if (!session.data) {
    return (
      <EmptyState
        icon={<LogIn />}
        title="Sign in to see your wishlist"
        description="Saved products are kept with your account, so they're there on any device."
        action={
          <>
            <Button asChild>
              <Link href="/login?next=/wishlist">Sign in</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">Create an account</Link>
            </Button>
          </>
        }
      />
    );
  }

  if (wishlist.isPending) return <Loading />;

  if (wishlist.isError) {
    return (
      <ErrorState
        icon={<TriangleAlert />}
        title="Your wishlist didn't load"
        description={wishlist.error.message}
        action={
          <Button onClick={() => wishlist.refetch()}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    );
  }

  const items = wishlist.data;
  if (items.length === 0) {
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

  return (
    <>
      <p className="mb-6 text-sm text-ink-muted" aria-live="polite">
        {items.length} {items.length === 1 ? "product" : "products"} saved. Tap a heart to remove; you can undo.
      </p>
      <ul className={grid}>
        {items.map((item) => (
          <li key={item.product.id} className="flex">
            <ProductCard {...item} className="w-full" />
          </li>
        ))}
      </ul>
    </>
  );
}
