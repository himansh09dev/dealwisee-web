import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProductWithInsight } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Offers ranked by total cost (price + shipping), because the sticker price
 * alone can be misleading. A real <table> so screen readers get headers.
 */
export function OfferTable({ item, className }: { item: ProductWithInsight; className?: string }) {
  const { product, insight } = item;
  const offers = insight.offers;
  const bestTotal = insight.best.total;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[30rem] border-collapse text-sm tabular-nums">
        <caption className="sr-only">
          Offers for {product.name}, sorted by total price including shipping
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th scope="col" className="py-2.5 pr-4 font-medium">
              Store
            </th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">
              Price
            </th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">
              Shipping
            </th>
            <th scope="col" className="py-2.5 pr-4 text-right font-medium">
              Total
            </th>
            <th scope="col" className="py-2.5 text-right font-medium">
              Availability
            </th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => {
            const isBest = offer.inStock && offer.total === bestTotal;
            return (
              <tr
                key={offer.storeId}
                className={cn("border-b border-line last:border-0", !offer.inStock && "text-ink-subtle")}
              >
                <th scope="row" className="py-3 pr-4 text-left font-medium">
                  <span className="flex items-center gap-2">
                    {offer.storeName}
                    {isBest && (
                      <Badge tone="signal">
                        <Check aria-hidden strokeWidth={3} />
                        Best total
                      </Badge>
                    )}
                  </span>
                </th>
                <td className="py-3 pr-4 text-right">{formatPrice(offer.price, { precise: true })}</td>
                <td className="py-3 pr-4 text-right text-ink-muted">
                  {offer.shipping === 0 ? "Free" : formatPrice(offer.shipping, { precise: true })}
                </td>
                <td
                  className={cn(
                    "py-3 pr-4 text-right font-semibold",
                    isBest ? "text-signal-ink" : offer.inStock && "text-ink",
                  )}
                >
                  {formatPrice(offer.total, { precise: true })}
                </td>
                <td className="py-3 text-right text-xs">
                  {offer.inStock ? (
                    <span className="text-ink-muted">In stock</span>
                  ) : (
                    <span>Out of stock</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
