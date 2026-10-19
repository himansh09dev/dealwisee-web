import { priceInsight, type PriceInsight, type Product } from "@pricepilot/contracts";

/*
 * The catalog contract lives in @pricepilot/contracts (shared with the API).
 * This module adds the web-only view model: a product paired with the price
 * explanation the UI renders.
 */

export * from "@pricepilot/contracts";

export type ProductWithInsight = { product: Product; insight: PriceInsight };

export function withInsight(product: Product): ProductWithInsight {
  return { product, insight: priceInsight(product) };
}
