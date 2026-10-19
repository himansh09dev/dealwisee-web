import type { Product } from "./catalog.ts";

/*
 * Pure price maths shared by the API (to derive currentPrice/previousPrice
 * on write) and the web app (to explain prices). Every claim about a price
 * comes from here, so the UI can't show a trend the data doesn't contain.
 */

type OfferLike = { storeId: string; storeName?: string; price: number; shipping: number; inStock: boolean };

export type PricedOffer = OfferLike & { total: number; storeName: string };

export function priceOffers(offers: readonly OfferLike[]): PricedOffer[] {
  return offers
    .map((o) => ({ ...o, storeName: o.storeName ?? o.storeId, total: o.price + o.shipping }))
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.total - b.total);
}

/** Cheapest in-stock total; falls back to the cheapest offer when nothing is in stock. */
export function bestOffer(offers: readonly OfferLike[]): PricedOffer | undefined {
  return priceOffers(offers)[0];
}

/** Values the API stores alongside a product so it can sort and filter by price. */
export function derivePrices(input: { offers: readonly OfferLike[]; history?: readonly number[] }) {
  const best = bestOffer(input.offers);
  if (!best) throw new Error("A product needs at least one offer");
  const previous = input.history?.at(-1);
  return { currentPrice: best.total, previousPrice: previous };
}

/** Weekly series: stored history plus this week's price. Null without history. */
export function priceSeries(product: Pick<Product, "history" | "currentPrice">): number[] | null {
  if (!product.history || product.history.length === 0) return null;
  return [...product.history, product.currentPrice];
}

export type PriceInsight = {
  best: PricedOffer;
  offers: PricedOffer[];
  highestTotal: number;
  storeCount: number;
  inStockCount: number;
  history: { average: number; low: number; high: number; vsAverage: number } | null;
};

export function priceInsight(product: Pick<Product, "offers" | "history" | "currentPrice">): PriceInsight {
  const offers = priceOffers(product.offers);
  const [best] = offers;
  if (!best) throw new Error("A product needs at least one offer");
  const series = priceSeries(product);
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
    offers,
    highestTotal: Math.max(...offers.map((o) => o.total)),
    storeCount: offers.length,
    inStockCount: offers.filter((o) => o.inStock).length,
    history,
  };
}

/** (current − average) / average, or null without enough history. Stored for the "drops" sort. */
export function vsAverage(product: Pick<Product, "offers" | "history" | "currentPrice">): number | null {
  return priceInsight(product).history?.vsAverage ?? null;
}
