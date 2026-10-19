"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { productKeys, searchProducts } from "@/lib/catalog/client";
import { formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

type ProductPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Slugs already in the comparison; shown but not selectable. */
  exclude: readonly string[];
  onPick: (slug: string, name: string) => void;
};

export function ProductPicker({ open, onOpenChange, title, description, exclude, onPick }: ProductPickerProps) {
  const [q, setQ] = useState("");
  // Debounced because each change triggers a request.
  const debouncedQ = useDebouncedValue(q.trim(), 250);

  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: productKeys.search(debouncedQ),
    queryFn: async ({ signal }) => {
      const page = await searchProducts(debouncedQ, signal);
      // Seed per-product entries so choosing a result needs no extra request.
      for (const item of page.items) queryClient.setQueryData(productKeys.one(item.product.slug), item);
      return page;
    },
    enabled: open,
    // Keep showing the previous list while the next one loads (no flicker).
    placeholderData: keepPreviousData,
  });

  let body: ReactNode;
  if (isPending) {
    body = (
      <ul aria-hidden className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </ul>
    );
  } else if (isError) {
    body = (
      <div role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-danger">
        Products couldn&rsquo;t be loaded.{" "}
        <Button variant="link" size="sm" onClick={() => refetch()} className="text-danger">
          Try again
        </Button>
      </div>
    );
  } else if (data.items.length === 0) {
    body = <p className="py-8 text-center text-sm text-ink-muted">No products match &ldquo;{debouncedQ}&rdquo;.</p>;
  } else {
    body = (
      <ul className="divide-y divide-line" aria-busy={isFetching}>
        {data.items.map(({ product, insight }) => {
          const taken = exclude.includes(product.slug);
          return (
            <li key={product.slug} className="flex items-center gap-3 py-2.5">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-sunken">
                <Image src={product.image.src} alt="" fill sizes="3rem" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                <span className="block text-xs text-ink-muted">
                  {product.brand} · {formatPrice(insight.best.total)}
                </span>
              </span>
              <Button
                size="sm"
                variant={taken ? "ghost" : "secondary"}
                disabled={taken}
                onClick={() => onPick(product.slug, product.name)}
                aria-label={taken ? `${product.name} is already in the comparison` : `Choose ${product.name}`}
              >
                {taken ? "Added" : "Choose"}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[8vh] max-h-[84vh]">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4">
          <SearchField
            id="picker-search"
            label="Search products"
            placeholder="Search by name or brand"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="mt-3 -mr-2 min-h-40 overflow-y-auto pr-2">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
