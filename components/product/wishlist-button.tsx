"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { toast } from "@/components/ui/toaster";
import { useSession } from "@/lib/auth/use-session";
import type { ProductWithInsight } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { useIsSaved, useWishlistToggle } from "@/lib/wishlist";

type WishlistButtonProps = {
  item: ProductWithInsight;
  variant?: "overlay" | "inline";
  className?: string;
};

export function WishlistButton({ item, variant = "overlay", className }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending: sessionPending } = useSession();
  const toggle = useWishlistToggle();
  const { product } = item;
  const { saved: isSaved, known } = useIsSaved(product.id);

  function run(save: boolean, withUndo: boolean) {
    toggle.mutate({ item, save });
    // Confirm right away (the UI is already optimistic); errors roll back and toast from the hook.
    if (withUndo) {
      toast(save ? "Saved to your wishlist" : "Removed from your wishlist", {
        description: product.name,
        action: { label: "Undo", onClick: () => run(!save, false) },
      });
    }
  }

  function onClick() {
    // Session still loading: ignore rather than wrongly asking a signed-in user to sign in.
    if (sessionPending) return;
    if (!user) {
      toast("Sign in to save products", {
        description: "Your wishlist is kept with your account.",
        action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(pathname)}`) },
      });
      return;
    }
    // Until the wishlist has loaded we can't know the current state (or roll back to it).
    if (!known) return;
    run(!isSaved, true);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSaved}
      aria-label={`Save ${product.name} to wishlist`}
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
          isSaved ? "fill-ink text-ink" : "group-hover/heart:text-ink",
        )}
      />
    </button>
  );
}
