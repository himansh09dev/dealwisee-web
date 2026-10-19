"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

export function WishlistLink({ className }: { className?: string }) {
  const count = useWishlist().length;

  return (
    <Link
      href="/wishlist"
      className={cn(
        "focus-ring relative inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/6 hover:text-ink",
        className,
      )}
    >
      <Heart aria-hidden className="size-[1.125rem]" />
      <span className="sr-only lg:not-sr-only">Wishlist</span>
      <span className="sr-only">, {count} saved</span>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute top-1 left-6 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-2xs font-semibold text-ink-inverse tabular-nums lg:static lg:h-5 lg:min-w-5"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
