import Link from "next/link";

import type { ProductWithInsight } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

import { Price, PriceDelta } from "./price";
import { ProductImage } from "./product-image";
import { WishlistButton } from "./wishlist-button";

type ProductCardProps = ProductWithInsight & {
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Compact, information-dense card. The whole card is clickable through the
 * title link's stretched pseudo-element; the wishlist toggle sits above it.
 */
export function ProductCard({
  product,
  insight,
  sizes = "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw",
  priority,
  className,
}: ProductCardProps) {
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        <ProductImage
          image={product.image}
          sizes={sizes}
          priority={priority}
          className="[&_img]:transition-transform [&_img]:duration-(--duration-slow) [&_img]:ease-out-soft motion-safe:group-hover:[&_img]:scale-[1.03]"
        />
        <WishlistButton item={{ product, insight }} className="absolute top-2.5 right-2.5 z-10" />
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <p className="eyebrow text-ink-subtle">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-medium text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="focus-ring rounded-xs decoration-line-strong underline-offset-3 group-hover:underline after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{product.summary}</p>

        <div className="mt-auto pt-3.5">
          <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 border-t border-line pt-3">
            <Price amount={insight.best.total} compareAt={product.listPrice} />
            {insight.history && <PriceDelta ratio={insight.history.vsAverage} />}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Best at {insight.best.storeName}
            <span aria-hidden className="px-1.5 text-line-strong">
              /
            </span>
            {insight.storeCount} stores
          </p>
        </div>
      </div>
    </article>
  );
}
