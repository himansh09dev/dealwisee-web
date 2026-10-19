import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { suggestedSearches } from "@/components/layout/search-suggestions";
import { Price, PriceDelta } from "@/components/product/price";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/input";
import { getPriceSeries } from "@/lib/catalog/insight";
import type { ProductWithInsight } from "@/lib/catalog/types";

export function Hero({ spotlight }: { spotlight: ProductWithInsight }) {
  const { product, insight } = spotlight;
  const series = getPriceSeries(product);

  return (
    <section aria-labelledby="hero-title" className="page-container pt-10 pb-16 md:pt-16 lg:pb-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow text-signal-ink">Price intelligence for considered purchases</p>
          <h1
            id="hero-title"
            className="mt-5 font-display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.98] tracking-tightest text-balance text-ink"
          >
            Pay the right price, <em className="text-ink-muted">not the first one.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-ink-muted">
            PricePilot ranks offers by what you&rsquo;ll actually pay, shows how today compares with
            the last twelve weeks, and keeps a list of the things you&rsquo;re waiting on.
          </p>

          <form role="search" action="/products" className="mt-9 flex max-w-xl flex-col gap-2 sm:flex-row">
            <SearchField
              id="hero-search"
              name="q"
              size="lg"
              label="Search products"
              placeholder="What are you shopping for?"
            />
            <Button type="submit" size="lg" className="h-14 px-6">
              Search
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-subtle">Try</span>
            {suggestedSearches.map((term) => (
              <Link
                key={term}
                href={`/products?q=${encodeURIComponent(term)}`}
                className="focus-ring inline-flex h-7 items-center rounded-full border border-line-strong px-3 text-xs text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        {/* Spotlight: a real product rendered as a price "ticket" */}
        <div className="relative">
          <ProductImage
            image={product.image}
            ratio="landscape"
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="rounded-xl lg:aspect-[5/6]"
          />
          <div className="relative mx-3 -mt-24 rounded-xl border border-line bg-surface p-5 shadow-lg sm:mx-6 sm:p-6 lg:absolute lg:bottom-6 lg:-left-10 lg:mx-0 lg:mt-0 lg:w-[22rem]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-ink-subtle">{product.brand}</p>
                <p className="mt-1 truncate text-sm font-medium text-ink">{product.name}</p>
              </div>
              {insight.history && <PriceDelta ratio={insight.history.vsAverage} />}
            </div>
            <div className="mt-5 flex items-end justify-between gap-4 border-t border-dashed border-line-strong pt-4">
              <div>
                <p className="text-xs text-ink-muted">Lowest total today</p>
                <Price amount={insight.best.total} compareAt={product.listPrice} size="xl" className="mt-1" />
              </div>
              {series && <PriceHistoryChart series={series} variant="spark" className="w-28" />}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
              <span>
                at {insight.best.store.name} · {insight.inStockCount} of {insight.storeCount} stores in stock
              </span>
              <Link
                href={`/products/${product.slug}`}
                className="focus-ring inline-flex items-center gap-1 rounded-xs font-medium text-ink hover:underline"
              >
                Offers
                <span className="sr-only"> for {product.name}</span>
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
