"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";
import { hasActiveFilters } from "@/lib/catalog/query";

import { clearedFilters } from "./active-filters";
import { useListing } from "./listing-context";

export function EmptyResults() {
  const { query, update } = useListing();
  const filtered = hasActiveFilters(query);

  return (
    <EmptyState
      icon={<SearchX />}
      title={query.q ? `No results for “${query.q}”` : "No products match these filters"}
      description={
        filtered
          ? "Try a broader search, remove a filter, or raise the price limit."
          : "The catalog is empty right now."
      }
      action={
        filtered ? (
          <>
            <Button onClick={() => update(clearedFilters)}>Clear all filters</Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to discovery</Link>
            </Button>
          </>
        ) : undefined
      }
    />
  );
}
