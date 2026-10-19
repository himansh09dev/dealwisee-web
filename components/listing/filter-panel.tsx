"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { categoryIdSchema, type Facet } from "@/lib/catalog/schema";

import { useListing } from "./listing-context";

export type Facets = { categories: Facet[]; brands: Facet[] };

function toggle<T>(list: readonly T[], value: T, on: boolean): T[] {
  return on ? [...list, value] : list.filter((v) => v !== value);
}

function FacetGroup({
  legend,
  facets,
  selected,
  idPrefix,
  onChange,
}: {
  legend: string;
  facets: Facet[];
  selected: readonly string[];
  idPrefix: string;
  onChange: (value: string, checked: boolean) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow text-ink-subtle">{legend}</legend>
      <ul className="mt-3 space-y-2">
        {facets.map((f) => {
          const id = `${idPrefix}-${f.value.replace(/\W+/g, "-")}`;
          const checked = selected.includes(f.value);
          return (
            <li key={f.value} className="flex items-center gap-2.5">
              <Checkbox
                id={id}
                checked={checked}
                // Facets with no results can't add anything; disable instead of hiding.
                disabled={f.count === 0 && !checked}
                onCheckedChange={(v) => onChange(f.value, v === true)}
              />
              <Label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between gap-2 font-normal text-ink-muted peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                <span className="text-ink">{f.label}</span>
                <span className="text-xs text-ink-subtle tabular-nums">{f.count}</span>
              </Label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/**
 * Price is applied explicitly (button / Enter) rather than debounced: half-
 * typed numbers like "1" on the way to "150" would otherwise flash wrong
 * results.
 */
function PriceRange({ idPrefix }: { idPrefix: string }) {
  const { query, update } = useListing();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const read = (name: string) => {
      const raw = data.get(name);
      if (typeof raw !== "string" || raw.trim() === "") return null;
      const n = Math.floor(Number(raw));
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    let min = read("min");
    let max = read("max");
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    update({ minPrice: min, maxPrice: max });
  }

  return (
    <form
      onSubmit={onSubmit}
      // Remount when the URL changes elsewhere (chip removed, clear all).
      key={`${query.minPrice}-${query.maxPrice}`}
    >
      <fieldset>
        <legend className="eyebrow text-ink-subtle">Price (total, USD)</legend>
        <div className="mt-3 flex items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor={`${idPrefix}-min`} className="text-xs font-normal text-ink-muted">
              Min
            </Label>
            <Input
              id={`${idPrefix}-min`}
              name="min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              defaultValue={query.minPrice ?? ""}
            />
          </div>
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor={`${idPrefix}-max`} className="text-xs font-normal text-ink-muted">
              Max
            </Label>
            <Input
              id={`${idPrefix}-max`}
              name="max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              defaultValue={query.maxPrice ?? ""}
            />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

export function FilterPanel({ facets, idPrefix }: { facets: Facets; idPrefix: string }) {
  const { query, update } = useListing();

  return (
    <div className="space-y-8">
      <FacetGroup
        legend="Category"
        facets={facets.categories}
        selected={query.categories}
        idPrefix={`${idPrefix}-cat`}
        onChange={(value, on) => {
          const id = categoryIdSchema.safeParse(value);
          if (id.success) update({ categories: toggle(query.categories, id.data, on) });
        }}
      />
      <FacetGroup
        legend="Brand"
        facets={facets.brands}
        selected={query.brands}
        idPrefix={`${idPrefix}-brand`}
        onChange={(value, on) => update({ brands: toggle(query.brands, value, on) })}
      />
      <PriceRange idPrefix={idPrefix} />
    </div>
  );
}
