import type { PricedOffer, PriceInsight, Product, ProductWithInsight, Store } from "./schema";

/*
 * Pure price maths. Everything shown about a price is derived here from a
 * product's offers and (optional) history, so the UI can never claim a
 * trend the data doesn't contain.
 */

export function pricedOffers(product: Product, stores: ReadonlyMap<string, Store>): PricedOffer[] {
  return product.offers.map((o) => ({
    ...o,
    total: o.price + o.shipping,
    store: stores.get(o.storeId) ?? { id: o.storeId, name: o.storeId },
  }));
}

/** In-stock offers first, each group cheapest-total first. */
export function sortOffersByTotal(offers: PricedOffer[]): PricedOffer[] {
  return [...offers].sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.total - b.total);
}

/**
 * Weekly series for charts: stored history plus this week's best in-stock
 * total. Returns null when there is no history, so callers must handle it.
 */
export function getPriceSeries(product: Product): number[] | null {
  if (!product.history || product.history.length === 0) return null;
  const totals = product.offers.filter((o) => o.inStock).map((o) => o.price + o.shipping);
  return totals.length > 0 ? [...product.history, Math.min(...totals)] : product.history;
}

export function getPriceInsight(product: Product, stores: ReadonlyMap<string, Store>): PriceInsight {
  const offers = pricedOffers(product, stores);
  const inStock = offers.filter((o) => o.inStock);
  // Prefer the cheapest offer you can actually buy; fall back to any offer.
  const pool = inStock.length > 0 ? inStock : offers;
  const [first, ...rest] = pool;
  if (!first) throw new Error(`Product "${product.slug}" has no offers`);
  const best = rest.reduce((min, o) => (o.total < min.total ? o : min), first);

  const series = getPriceSeries(product);
  let history: PriceInsight["history"] = null;
  if (series && series.length >= 2) {
    const average = Math.round(series.reduce((sum, v) => sum + v, 0) / series.length);
    history = {
      average,
      low: Math.min(...series),
      high: Math.max(...series),
      vsAverage: (best.total - average) / average,
    };
  }

  return {
    best,
    offers: sortOffersByTotal(offers),
    highestTotal: Math.max(...offers.map((o) => o.total)),
    storeCount: offers.length,
    inStockCount: inStock.length,
    history,
  };
}

export function withInsight(product: Product, stores: ReadonlyMap<string, Store>): ProductWithInsight {
  return { product, insight: getPriceInsight(product, stores) };
}
