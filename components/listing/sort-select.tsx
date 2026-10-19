"use client";

import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sortOptions, sortValues, type ProductSort } from "@/lib/catalog/query";

import { useListing } from "./listing-context";

function isSort(value: string): value is ProductSort {
  return sortValues.some((v) => v === value);
}

export function SortSelect() {
  const { query, update } = useListing();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="shrink-0 text-sm font-normal text-ink-muted">
        Sort
      </Label>
      <Select
        value={query.sort}
        onValueChange={(value) => {
          if (isSort(value)) update({ sort: value });
        }}
      >
        <SelectTrigger id="sort" className="h-9 w-auto min-w-48">
          {/* Explicit label so server-rendered HTML shows it before hydration. */}
          <SelectValue>{sortOptions.find((o) => o.value === query.sort)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
