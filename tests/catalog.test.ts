import { describe, expect, it } from "vitest";

import { categories, products, stores } from "@/lib/catalog/data";
import { queryProducts, relatedProducts } from "@/lib/catalog/filter";
import { getPriceInsight, getPriceSeries, withInsight } from "@/lib/catalog/insight";
import { defaultQuery } from "@/lib/catalog/query";
import { productSchema, type Product } from "@/lib/catalog/schema";

const storeMap = new Map(stores.map((s) => [s.id, s]));
const all = products.map((p) => withInsight(p, storeMap));
const base = (): Product => ({
  slug: "test",
  name: "Test",
  brand: "Brand",
  category: "audio",
  summary: "s",
  image: { src: "/images/x.jpg", alt: "x" },
  addedAt: "2026-01-01",
  offers: [
    { storeId: "a", price: 1000, shipping: 0, inStock: true },
    { storeId: "b", price: 800, shipping: 500, inStock: true },
    { storeId: "c", price: 500, shipping: 0, inStock: false },
  ],
  specs: [],
});

describe("seed data", () => {
  it("every product satisfies the shared schema", () => {
    for (const p of products) expect(() => productSchema.parse(p)).not.toThrow();
  });

  it("every offer references a known store and slugs are unique", () => {
    for (const p of products) for (const o of p.offers) expect(storeMap.has(o.storeId)).toBe(true);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });
});

describe("getPriceInsight", () => {
  it("picks the cheapest in-stock total, not the cheapest sticker", () => {
    const insight = getPriceInsight(base(), new Map());
    expect(insight.best.storeId).toBe("a"); // 1000 vs 800+500; "c" is out of stock
    expect(insight.inStockCount).toBe(2);
    expect(insight.offers.map((o) => o.storeId)).toEqual(["a", "b", "c"]);
  });

  it("makes no history claims when there is no history", () => {
    const p = base();
    expect(getPriceSeries(p)).toBeNull();
    expect(getPriceInsight(p, new Map()).history).toBeNull();
  });

  it("computes vs-average from history plus this week's price", () => {
    const insight = getPriceInsight({ ...base(), history: [2000, 2000, 1000] }, new Map());
    // series = [2000, 2000, 1000, 1000] → average 1500; best 1000 → −33%
    expect(insight.history?.average).toBe(1500);
    expect(insight.history?.vsAverage).toBeCloseTo(-1 / 3);
  });
});

describe("queryProducts", () => {
  it("requires every search term to match", () => {
    const res = queryProducts(all, { ...defaultQuery, q: "sony headphones" }, categories);
    expect(res.items.map((i) => i.product.slug)).toEqual(["sony-wh-1000xm4"]);
  });

  it("filters by category, brand and total price", () => {
    const res = queryProducts(
      all,
      { ...defaultQuery, categories: ["footwear"], brands: ["Nike"], maxPrice: 100, pageSize: 50 },
      categories,
    );
    expect(res.items.every((i) => i.insight.best.total <= 10000 && i.product.brand === "Nike")).toBe(true);
    expect(res.total).toBe(1);
  });

  it("counts facets without applying their own dimension", () => {
    const res = queryProducts(all, { ...defaultQuery, categories: ["audio"] }, categories);
    const phones = res.facets.categories.find((f) => f.value === "phones");
    expect(phones?.count).toBe(products.filter((p) => p.category === "phones").length);
  });

  it("sorts by price and clamps out-of-range pages", () => {
    const res = queryProducts(all, { ...defaultQuery, sort: "price-asc", page: 99 }, categories);
    expect(res.page).toBe(res.pageCount);
    const asc = queryProducts(all, { ...defaultQuery, sort: "price-asc", pageSize: 50 }, categories).items;
    const totals = asc.map((i) => i.insight.best.total);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });

  it("returns an empty page, not an error, when nothing matches", () => {
    const res = queryProducts(all, { ...defaultQuery, q: "zzzz-no-match" }, categories);
    expect(res).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
  });
});

describe("relatedProducts", () => {
  it("excludes the product itself and prefers the same category", () => {
    const target = all.find((i) => i.product.slug === "nike-air-max-1");
    if (!target) throw new Error("fixture missing");
    const related = relatedProducts(all, target, 3);
    expect(related.some((r) => r.product.slug === target.product.slug)).toBe(false);
    expect(related[0]?.product.category).toBe("footwear");
  });
});
