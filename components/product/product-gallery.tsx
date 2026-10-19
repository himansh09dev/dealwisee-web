"use client";

import { Expand } from "lucide-react";
import Image from "next/image";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "@/lib/catalog/types";

import { ProductImage } from "./product-image";

/** Primary image with a full-size view. The catalog has one photo per product. */
export function ProductGallery({ product }: { product: Product }) {
  return (
    <Dialog>
      <div className="group relative">
        <ProductImage
          image={product.image}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="rounded-xl"
        />
        <DialogTrigger
          className="focus-ring absolute right-3 bottom-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-surface/90 px-3.5 text-sm font-medium text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-surface"
        >
          <Expand aria-hidden className="size-4" />
          Enlarge
        </DialogTrigger>
      </div>
      <DialogContent className="top-[4vh] max-h-[92vh] max-w-4xl p-3 sm:p-4">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{product.image.alt}</DialogDescription>
        <div className="relative aspect-square max-h-[calc(92vh-2rem)] w-full overflow-hidden rounded-lg bg-sunken sm:aspect-[4/3]">
          <Image src={product.image.url} alt={product.image.alt} fill sizes="90vw" className="object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
