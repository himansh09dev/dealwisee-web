import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { OfferTable } from "@/components/product/offer-table";
import { PriceDelta } from "@/components/product/price";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { priceSeries } from "@/lib/catalog/schema";
import type { ProductWithInsight } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

import { SectionHeader } from "./section-header";

/** Builds the explanatory sentence from the data so copy can't drift from numbers. */
function stickerVsTotal({ insight }: ProductWithInsight) {
  const offers = insight.offers.filter((o) => o.inStock);
  if (offers.length === 0) return null;
  const cheapestSticker = offers.reduce((min, o) => (o.price < min.price ? o : min));
  if (cheapestSticker.storeId === insight.best.storeId) return null;
  return (
    <>
      {cheapestSticker.storeName} has the lowest sticker price at{" "}
      <strong className="font-semibold text-ink">{formatPrice(cheapestSticker.price, { precise: true })}</strong>, but{" "}
      {formatPrice(cheapestSticker.shipping, { precise: true })} shipping makes it{" "}
      {formatPrice(cheapestSticker.total, { precise: true })}. {insight.best.storeName} is the better buy
      at <strong className="font-semibold text-signal-ink">{formatPrice(insight.best.total, { precise: true })}</strong>{" "}
      delivered.
    </>
  );
}

export function ComparisonPreview({ item }: { item: ProductWithInsight }) {
  const { product, insight } = item;
  const insightCopy = stickerVsTotal(item);
  const series = priceSeries(product);

  return (
    <section aria-labelledby="compare-title" className="page-container py-12">
      <SectionHeader
        id="compare-title"
        index="04 — Comparison"
        title={
          <>
            The cheapest sticker isn&rsquo;t always <em>the cheapest price</em>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <ProductImage image={product.image} sizes="5rem" className="w-20 shrink-0" />
            <div className="min-w-0">
              <p className="eyebrow text-ink-subtle">{product.brand}</p>
              <p className="mt-1 font-medium text-ink">{product.name}</p>
              <p className="text-sm text-ink-muted">{product.summary}</p>
            </div>
          </div>
          {insightCopy && <p className="mt-6 text-lg text-pretty text-ink-muted">{insightCopy}</p>}
          <p className="mt-4 text-sm text-ink-muted">
            Every comparison ranks in-stock offers by total cost, then shows where today sits against
            the 12-week range.
          </p>
          <div className="mt-6 lg:mt-auto">
            <Button asChild variant="secondary">
              <Link href={`/products/${product.slug}`}>
                Open full comparison
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <OfferTable item={item} />
          {series && insight.history && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-ink">{series.length}-week price history</h3>
                <PriceDelta ratio={insight.history.vsAverage} />
              </div>
              <PriceHistoryChart series={series} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
