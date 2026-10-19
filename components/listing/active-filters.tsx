"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hasActiveFilters, type ProductQuery } from "@/lib/catalog/query";
import type { Category } from "@/lib/catalog/schema";

import { useListing } from "./listing-context";

type Chip = { key: string; label: string; remove: Partial<ProductQuery> };

function buildChips(query: ProductQuery, categories: Category[]): Chip[] {
  const name = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const chips: Chip[] = [];
  if (query.q) chips.push({ key: "q", label: `“${query.q}”`, remove: { q: "" } });
  for (const c of query.categories) {
    chips.push({
      key: `c-${c}`,
      label: name(c),
      remove: { categories: query.categories.filter((v) => v !== c) },
    });
  }
  for (const b of query.brands) {
    chips.push({ key: `b-${b}`, label: b, remove: { brands: query.brands.filter((v) => v !== b) } });
  }
  if (query.minPrice !== null || query.maxPrice !== null) {
    const label =
      query.minPrice !== null && query.maxPrice !== null
        ? `$${query.minPrice}–$${query.maxPrice}`
        : query.minPrice !== null
          ? `From $${query.minPrice}`
          : `Up to $${query.maxPrice}`;
    chips.push({ key: "price", label, remove: { minPrice: null, maxPrice: null } });
  }
  return chips;
}

export const clearedFilters: Partial<ProductQuery> = {
  q: "",
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
};

export function ActiveFilters({ categories }: { categories: Category[] }) {
  const { query, update } = useListing();
  if (!hasActiveFilters(query)) return null;
  const chips = buildChips(query, categories);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => update(chip.remove)}
          className="focus-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface pr-2 pl-3 text-sm text-ink transition-colors hover:border-ink-muted"
        >
          {chip.label}
          <X aria-hidden className="size-3.5 text-ink-muted" />
          <span className="sr-only">(remove filter)</span>
        </button>
      ))}
      <Button variant="link" size="sm" onClick={() => update(clearedFilters)} className="ml-1">
        Clear all
      </Button>
    </div>
  );
}
