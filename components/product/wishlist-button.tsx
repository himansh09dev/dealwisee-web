"use client";

import { Heart } from "lucide-react";

import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { useWishlist, wishlist } from "@/lib/wishlist";

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
    if (saved) {
      const index = wishlist.indexOf(slug);
      wishlist.remove(slug);
      toast("Removed from your wishlist", {
        description: productName,
        action: { label: "Undo", onClick: () => wishlist.restore(slug, index) },
      });
    } else {
      wishlist.add(slug);
      toast("Saved to your wishlist", {
        description: "Stored on this device until accounts arrive.",
        action: { label: "Undo", onClick: () => wishlist.remove(slug) },
      });
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={`Save ${productName} to wishlist`}
      className={cn(
        "focus-ring group/heart grid shrink-0 cursor-pointer place-items-center rounded-full transition-[background-color,color,transform] duration-(--duration-fast) active:scale-90",
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
