"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useTransition, type ReactNode } from "react";

import { productsHref, type ProductQuery } from "@/lib/catalog/query";

type ListingContextValue = {
  /** Parsed from the URL on the server: the single source of truth. */
  query: ProductQuery;
  total: number;
  /** True while a new result set is loading after a filter change. */
  isPending: boolean;
  /** Merge changes into the URL. Any filter change resets to page 1. */
  update: (changes: Partial<ProductQuery>) => void;
};

const ListingContext = createContext<ListingContextValue | null>(null);

export function useListing() {
  const value = use(ListingContext);
  if (!value) throw new Error("useListing must be used inside <ListingProvider>");
  return value;
}

/**
 * Filter controls write to the URL with router.replace inside a transition:
 * - replace (not push): typing or ticking boxes shouldn't flood history;
 *   pagination uses real links, so Back still steps between pages.
 * - transition: the current results stay on screen (dimmed) while the
 *   server renders the next set, instead of flashing a skeleton.
 */
export function ListingProvider({
  query,
  total,
  children,
}: {
  query: ProductQuery;
  total: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Debounced callers may fire after newer URL state arrived; always merge
  // onto the latest query so a delayed search can't undo a ticked filter.
  const latest = useRef(query);
  useEffect(() => {
    latest.current = query;
  }, [query]);

  function update(changes: Partial<ProductQuery>) {
    const next = { ...latest.current, page: 1, ...changes };
    latest.current = next;
    startTransition(() => router.replace(productsHref(next), { scroll: false }));
  }

  return <ListingContext value={{ query, total, isPending, update }}>{children}</ListingContext>;
}

/** Dims and marks results busy while a filter change is in flight. */
export function PendingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const { isPending } = useListing();
  return (
    <div
      aria-busy={isPending}
      data-pending={isPending || undefined}
      className={`transition-opacity duration-(--duration-base) data-pending:opacity-55 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
