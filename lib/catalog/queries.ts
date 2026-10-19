import { categories, products, stores } from "./data";
import type { Category, PriceInsight, Product, Store } from "./types";

/*
 * Read-side helpers over the sample catalog. Signatures are async-free on
 * purpose for now; when the API lands these become fetchers with the same
 * shapes, so components don't change.
 */

const storeById = new Map(stores.map((s) => [s.id, s]));

function getStore(id: Store["id"]): Store {
  const store = storeById.get(id);
  if (!store) throw new Error(`Unknown store "${id}"`);
  return store;
}

export type PricedOffer = PriceInsight["best"];

function pricedOffers(product: Product): PricedOffer[] {
  return product.offers.map((o) => ({
    ...o,
    total: o.price + o.shipping,
    store: getStore(o.storeId),
  }));
}

export function getPriceInsight(product: Product): PriceInsight {
  const offers = pricedOffers(product);
  if (offers.length === 0) throw new Error(`Product "${product.slug}" has no offers`);

  const inStock = offers.filter((o) => o.inStock);
  // Prefer the cheapest offer you can actually buy; fall back to any offer.
  const pool = inStock.length > 0 ? inStock : offers;
  const best = pool.reduce((min, o) => (o.total < min.total ? o : min));

  const series = getPriceSeries(product);
  const historyAverage = Math.round(series.reduce((sum, v) => sum + v, 0) / series.length);

  return {
    best,
    highestTotal: Math.max(...offers.map((o) => o.total)),
    storeCount: offers.length,
    inStockCount: inStock.length,
    historyAverage,
    historyLow: Math.min(...series),
    historyHigh: Math.max(...series),
    vsAverage: (best.total - historyAverage) / historyAverage,
  };
}

/** 12 weekly points: the stored 11 weeks plus this week's best total. */
export function getPriceSeries(product: Product): number[] {
  const totals = pricedOffers(product)
    .filter((o) => o.inStock)
    .map((o) => o.total);
  const current = totals.length > 0 ? Math.min(...totals) : product.history.at(-1);
  return current === undefined ? product.history : [...product.history, current];
}

/** In-stock offers first, each group cheapest-total first. */
export function getOffersByTotal(product: Product): PricedOffer[] {
  return pricedOffers(product).sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.total - b.total);
}

export type ProductWithInsight = { product: Product; insight: PriceInsight };

export function getCatalog(): ProductWithInsight[] {
  return products.map((product) => ({ product, insight: getPriceInsight(product) }));
}

export function getProduct(slug: string): ProductWithInsight | undefined {
  const product = products.find((p) => p.slug === slug);
  return product && { product, insight: getPriceInsight(product) };
}

export type ProductSort = "drops" | "price" | "newest";

export function sortCatalog(items: ProductWithInsight[], sort: ProductSort) {
  const copy = [...items];
  switch (sort) {
    case "drops":
      return copy.sort((a, b) => a.insight.vsAverage - b.insight.vsAverage);
    case "price":
      return copy.sort((a, b) => a.insight.best.total - b.insight.best.total);
    case "newest":
      return copy.sort((a, b) => b.product.addedAt.localeCompare(a.product.addedAt));
  }
}

export type CategorySummary = Category & { count: number; cover: Product["image"] };

export function getCategorySummaries(): CategorySummary[] {
  return categories.flatMap((category) => {
    const items = products.filter((p) => p.category === category.id);
    const first = items[0];
    return first ? [{ ...category, count: items.length, cover: first.image }] : [];
  });
}

/** Accepts any string so untrusted input (e.g. search params) can be checked directly. */
export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCatalogStats() {
  return { productCount: products.length, storeCount: stores.length };
}
