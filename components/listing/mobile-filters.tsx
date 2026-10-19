"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { FilterPanel, type Facets } from "./filter-panel";
import { useListing } from "./listing-context";

export function MobileFilters({ facets }: { facets: Facets }) {
  const [open, setOpen] = useState(false);
  const { query, total, isPending } = useListing();
  const count =
    query.categories.length + query.brands.length + (query.minPrice !== null || query.maxPrice !== null ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="h-9 lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filters
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-2xs text-ink-inverse tabular-nums">
              {count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent placement="sheet" closeLabel="Close filters">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
          <DialogTitle className="font-sans text-base font-semibold">Filters</DialogTitle>
          <DialogDescription className="sr-only">Results update as you change filters.</DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <FilterPanel facets={facets} idPrefix="sheet" />
        </div>
        <div className="border-t border-line p-4">
          <Button className="w-full" onClick={() => setOpen(false)} aria-live="polite">
            {isPending ? "Updating…" : `Show ${total} ${total === 1 ? "result" : "results"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
