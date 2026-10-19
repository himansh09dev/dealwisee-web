"use client";

import { Columns3, Plus, RefreshCw, RotateCcw, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

import { Price, PriceDelta } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { toast } from "@/components/ui/toaster";
import { useProductsBySlugs } from "@/lib/catalog/use-products";
import type { ProductWithInsight } from "@/lib/catalog/types";
import { COMPARE_MAX, compareList, useCompareList } from "@/lib/compare";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { ProductPicker } from "./product-picker";

type PickerState = { mode: "add" } | { mode: "replace"; slug: string; name: string } | null;

/*
 * Layout: an ARIA table built from CSS grid. On wide screens the row label
 * sits in a left column; on phones it spans the full width above the
 * values, so up to three products fit side by side without sideways scroll.
 */
const rowGrid =
  "grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-x-3 md:grid-cols-[11rem_repeat(var(--cols),minmax(0,1fr))] md:gap-x-6";

function Row({ label, children, muted }: { label: string; children: ReactNode; muted?: boolean }) {
  return (
    <div role="row" className={cn(rowGrid, "border-b border-line py-3.5")}>
      <div
        role="rowheader"
        className={cn("col-span-full mb-1.5 text-xs text-ink-muted md:col-span-1 md:mb-0 md:text-sm", muted && "opacity-70")}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="cell" className={cn("min-w-0 text-sm break-words text-ink", className)}>
      {children}
    </div>
  );
}

function specRows(items: ProductWithInsight[]) {
  const labels: string[] = [];
  for (const { product } of items) {
    for (const s of product.specs) if (!labels.includes(s.label)) labels.push(s.label);
  }
  return labels.map((label) => {
    const values = items.map(({ product }) => product.specs.find((s) => s.label === label)?.value ?? null);
    const differs = new Set(values).size > 1;
    return { label, values, differs };
  });
}

export function CompareView() {
  const hydrated = useHydrated();
  const slugs = useCompareList();
  const [picker, setPicker] = useState<PickerState>(null);
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const diffsId = useId();

  const { data, isPending, isError, refetch, isFetching } = useProductsBySlugs(slugs, hydrated);

  const pickerDialog = (
    <ProductPicker
      open={picker !== null}
      onOpenChange={(open) => !open && setPicker(null)}
      title={picker?.mode === "replace" ? `Replace ${picker.name}` : "Add a product"}
      description={
        picker?.mode === "replace"
          ? "Choose a product to take its place."
          : `Compare up to ${COMPARE_MAX} products side by side.`
      }
      exclude={slugs}
      onPick={(slug, name) => {
        if (picker?.mode === "replace") {
          compareList.replace(picker.slug, slug);
          toast(`Replaced with ${name}`);
        } else {
          compareList.add(slug);
        }
        setPicker(null);
      }}
    />
  );

  if (!hydrated || (slugs.length > 0 && isPending)) {
    return (
      <div aria-busy="true" aria-label="Loading comparison" className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-6 h-6 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (slugs.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Columns3 />}
          title="Nothing to compare yet"
          description={`Pick two or three products to line up their prices and specs. Use "Compare" on any product page, or choose here.`}
          action={
            <>
              <Button onClick={() => setPicker({ mode: "add" })}>
                <Plus aria-hidden />
                Choose products
              </Button>
              <Button asChild variant="secondary">
                <Link href="/products">Browse products</Link>
              </Button>
            </>
          }
        />
        {pickerDialog}
      </>
    );
  }

  if (isError && !data) {
    return (
      <ErrorState
        icon={<TriangleAlert />}
        title="Comparison didn't load"
        description="We couldn't fetch these products. Your selection is still saved on this device."
        action={
          <Button onClick={() => refetch()}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    );
  }

  // Order by the user's selection; ignore stale rows kept as placeholder data.
  const items = slugs.flatMap((s) => data?.find((i) => i.product.slug === s) ?? []);
  const canAdd = slugs.length < COMPARE_MAX;
  const cols = items.length + (canAdd ? 1 : 0);

  const cheapest = Math.min(...items.map((i) => i.insight.best.total));
  const allSamePrice = items.every((i) => i.insight.best.total === cheapest);
  const showListPrice = items.some((i) => i.product.listPrice !== undefined);
  const specs = specRows(items);
  const visibleSpecs = onlyDiffs ? specs.filter((s) => s.differs) : specs;
  const addSlot = canAdd ? <div role="cell" aria-hidden /> : null;

  function remove(item: ProductWithInsight) {
    const index = compareList.indexOf(item.product.slug);
    compareList.remove(item.product.slug);
    toast("Removed from comparison", {
      description: item.product.name,
      action: { label: "Undo", onClick: () => compareList.restore(item.product.slug, index) },
    });
  }

  return (
    <div style={{ "--cols": cols }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {items.length} of {COMPARE_MAX} selected
          {!canAdd && " — remove one to add another"}
          {items.length === 1 && " — add at least one more to compare"}
          {isFetching && (
            <RefreshCw aria-label="Updating" className="ml-2 inline size-3.5 animate-spin motion-reduce:animate-none" />
          )}
        </p>
        <Button variant="link" size="sm" onClick={() => compareList.clear()}>
          Clear comparison
        </Button>
      </div>

      <div role="table" aria-label="Product comparison: price">
        <div role="row" className={cn(rowGrid, "pb-5")}>
          <div role="columnheader" className="hidden md:block">
            <span className="sr-only">Attribute</span>
          </div>
          {items.map((item) => (
            <div role="columnheader" key={item.product.slug} className="min-w-0 text-left font-normal">
              <ProductImage image={item.product.image} sizes="(min-width: 768px) 22vw, 30vw" />
              <p className="eyebrow mt-3 text-ink-subtle">{item.product.brand}</p>
              <Link
                href={`/products/${item.product.slug}`}
                className="focus-ring mt-1 line-clamp-3 rounded-xs text-sm leading-snug font-medium text-ink hover:underline"
              >
                {item.product.name}
              </Link>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPicker({ mode: "replace", slug: item.product.slug, name: item.product.name })}
                >
                  Replace<span className="sr-only"> {item.product.name}</span>
                </Button>
                <Button variant="link" size="sm" className="text-xs" onClick={() => remove(item)}>
                  <X aria-hidden className="size-3!" />
                  Remove<span className="sr-only"> {item.product.name}</span>
                </Button>
              </div>
            </div>
          ))}
          {canAdd && (
            <div role="columnheader" className="min-w-0">
              <button
                type="button"
                onClick={() => setPicker({ mode: "add" })}
                className="focus-ring flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
              >
                <Plus aria-hidden className="size-5" />
                Add product
              </button>
            </div>
          )}
        </div>

        <Row label="Lowest total">
          {items.map((item) => {
            const diff = item.insight.best.total - cheapest;
            return (
              <Cell key={item.product.slug}>
                <Price amount={item.insight.best.total} size="md" />
                <div className="mt-1">
                  {allSamePrice || items.length < 2 ? null : diff === 0 ? (
                    <Badge tone="signal">Lowest</Badge>
                  ) : (
                    <span className="text-xs text-ink-muted tabular-nums">+{formatPrice(diff)} more</span>
                  )}
                </div>
              </Cell>
            );
          })}
          {addSlot}
        </Row>
        <Row label="Best store">
          {items.map((item) => (
            <Cell key={item.product.slug}>
              {item.insight.best.storeName}
              <span className="block text-xs text-ink-muted">
                {item.insight.inStockCount} of {item.insight.storeCount} stores in stock
              </span>
            </Cell>
          ))}
          {addSlot}
        </Row>
        <Row label="vs 12-week average">
          {items.map((item) => (
            <Cell key={item.product.slug}>
              {item.insight.history ? (
                <PriceDelta ratio={item.insight.history.vsAverage} />
              ) : (
                <span className="text-ink-subtle">No history</span>
              )}
            </Cell>
          ))}
          {addSlot}
        </Row>
        {showListPrice && (
          <Row label="List price">
            {items.map((item) => (
              <Cell key={item.product.slug} className="tabular-nums">
                {item.product.listPrice !== undefined ? formatPrice(item.product.listPrice) : "—"}
              </Cell>
            ))}
            {addSlot}
          </Row>
        )}
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-4">
        <h2 className="font-display text-2xl tracking-tight text-ink">Specifications</h2>
        {items.length > 1 && (
          <div className="flex items-center gap-2.5">
            <Checkbox id={diffsId} checked={onlyDiffs} onCheckedChange={(v) => setOnlyDiffs(v === true)} />
            <Label htmlFor={diffsId} className="cursor-pointer font-normal text-ink-muted">
              Only show differences
            </Label>
          </div>
        )}
      </div>
      <div role="table" aria-label="Product comparison: specifications" className="mt-2">
        <div role="row" className="sr-only">
          <span role="columnheader">Specification</span>
          {items.map((item) => (
            <span role="columnheader" key={item.product.slug}>
              {item.product.name}
            </span>
          ))}
        </div>
        {visibleSpecs.length === 0 ? (
          <p className="py-6 text-sm text-ink-muted">
            {onlyDiffs ? "These products share every listed specification." : "No specifications listed."}
          </p>
        ) : (
          visibleSpecs.map((row) => (
            <Row key={row.label} label={row.label}>
              {row.values.map((value, i) => (
                <Cell key={items[i]?.product.slug ?? i} className={cn(value === null && "text-ink-subtle")}>
                  {value ?? "—"}
                </Cell>
              ))}
              {addSlot}
            </Row>
          ))
        )}
      </div>

      {pickerDialog}
    </div>
  );
}
