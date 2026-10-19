"use client";

import { Heart } from "lucide-react";

import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

type WishlistButtonProps = {
  slug: string;
  productName: string;
  variant?: "overlay" | "inline";
  className?: string;
};

export function WishlistButton({
  slug,
  productName,
  variant = "overlay",
  className,
}: WishlistButtonProps) {
  const saved = useWishlist().includes(slug);

  function onToggle() {
    const nowSaved = toggleWishlist(slug);
    toast(nowSaved ? "Saved to your wishlist" : "Removed from your wishlist", {
      description: nowSaved ? "Stored on this device until accounts arrive." : productName,
      action: { label: "Undo", onClick: () => toggleWishlist(slug) },
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={`Save ${productName} to wishlist`}
      className={cn(
        "focus-ring group/heart grid cursor-pointer place-items-center rounded-full transition-[background-color,color,transform] duration-(--duration-fast) active:scale-90",
        variant === "overlay"
          ? "size-9 bg-surface/85 text-ink shadow-sm backdrop-blur-sm hover:bg-surface"
          : "size-10 border border-line-strong bg-surface text-ink hover:bg-paper",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "size-[1.0625rem] transition-[fill,color] duration-(--duration-base)",
          saved ? "fill-ink text-ink" : "group-hover/heart:text-ink",
        )}
      />
    </button>
  );
}
