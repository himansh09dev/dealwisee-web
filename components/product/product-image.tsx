import Image from "next/image";

import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  image: Product["image"];
  /** Rendered width hint for responsive images, e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string;
  ratio?: "square" | "portrait" | "landscape";
  /** Above-the-fold / LCP image: load eagerly with high fetch priority. */
  priority?: boolean;
  className?: string;
};

const ratios = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
} as const;

/**
 * A fixed-ratio, sunken well for product photography. Reserving the box
 * prevents layout shift; the hairline inner border keeps white-background
 * photos from bleeding into the page.
 */
export function ProductImage({
  image,
  sizes,
  ratio = "square",
  priority = false,
  className,
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-lg bg-sunken",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-ink/6 after:ring-inset",
        ratios[ratio],
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        // `priority` is deprecated in Next 16; eager + high fetch priority is the replacement.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="object-cover"
      />
    </div>
  );
}
