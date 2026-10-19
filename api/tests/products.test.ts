import { priceInsight, type Product } from "@pricepilot/contracts";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { ProductModel } from "../src/models/product.model.ts";
import { buildProductDocuments } from "../src/seed/build.ts";
import { seedProducts } from "../src/seed/data.ts";
import { makeApp, seedCatalog, useTestDatabase } from "./helpers.ts";

useTestDatabase();
const api = supertest(makeApp());
beforeEach(seedCatalog);

type Item = { slug: string; brand: string; category: string; currentPrice: number };

describe("GET /api/products", () => {
  it("returns a page of products with meta and facets", async () => {
    const res = await api.get("/api/products").expect(200);
    expect(res.body.data).toHaveLength(12);
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 12, total: 13, pageCount: 2 });
    expect(res.body.meta.facets.categories.length).toBeGreaterThan(0);
    // Newest first by default
    expect(res.body.data[0].slug).toBe("polaroid-onestep-2");
  });

  it("requires every search term to match", async () => {
    const res = await api.get("/api/products").query({ q: "sony headphones" }).expect(200);
    expect(res.body.data.map((p: Item) => p.slug)).toEqual(["sony-wh-1000xm4"]);
  });

  it("filters by category, brand and price (cents)", async () => {
    const res = await api
      .get("/api/products")
      .query({ category: "footwear", brand: "Nike", maxPrice: 10000 })
      .expect(200);
    const items: Item[] = res.body.data;
    expect(items.length).toBe(1);
    expect(items.every((p) => p.brand === "Nike" && p.category === "footwear" && p.currentPrice <= 10000)).toBe(true);
  });

  it("accepts repeated and comma-separated list params", async () => {
    const repeated = await api.get("/api/products?category=audio&category=phones").expect(200);
    const comma = await api.get("/api/products?category=audio,phones").expect(200);
    expect(repeated.body.meta.total).toBe(4);
    expect(comma.body.meta.total).toBe(4);
  });

  it("counts facets without applying their own dimension", async () => {
    const res = await api.get("/api/products").query({ category: "audio" }).expect(200);
    const phones = res.body.meta.facets.categories.find((f: { value: string }) => f.value === "phones");
    expect(phones.count).toBe(2);
  });

  it("sorts by price and puts products without history last for 'drops'", async () => {
    const asc = await api.get("/api/products").query({ sort: "price-asc", pageSize: 48 }).expect(200);
    const prices = asc.body.data.map((p: Item) => p.currentPrice);
    expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b));

    // A product with no price history can't be ranked by drop: it must sort last.
    const [template] = buildProductDocuments(seedProducts);
    if (!template) throw new Error("fixture missing");
    await ProductModel.create({ ...template, slug: "no-history", history: undefined, vsAverage: null });

    const drops = await api.get("/api/products").query({ sort: "drops", pageSize: 48 }).expect(200);
    const products: Product[] = drops.body.data;
    expect(products.at(-1)?.slug).toBe("no-history");
    const ratios = products.slice(0, -1).map((p) => priceInsight(p).history?.vsAverage ?? 0);
    expect(ratios).toEqual([...ratios].sort((a, b) => a - b));
  });

  it("clamps a page beyond the end to the last page", async () => {
    const res = await api.get("/api/products").query({ page: 99 }).expect(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.data).toHaveLength(1);
  });

  it.each([
    [{ pageSize: 1000 }, "pageSize"],
    [{ sort: "random" }, "sort"],
    [{ category: "spaceships" }, "category.0"],
    [{ minPrice: 500, maxPrice: 100 }, "minPrice"],
    [{ page: -1 }, "page"],
  ])("rejects invalid query %o with a 400", async (query, path) => {
    const res = await api.get("/api/products").query(query).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain(path);
  });

  it("returns an empty page, not an error, when nothing matches", async () => {
    const res = await api.get("/api/products").query({ q: "zzzz" }).expect(200);
    expect(res.body).toMatchObject({ data: [], meta: { total: 0, pageCount: 1 } });
  });
});

describe("GET /api/products/:slug", () => {
  it("returns the product with derived prices and no internal fields", async () => {
    const res = await api.get("/api/products/sony-wh-1000xm4").expect(200);
    expect(res.body.data).toMatchObject({ slug: "sony-wh-1000xm4", currentPrice: 24800, previousPrice: 25999 });
    expect(res.body.data).not.toHaveProperty("_id");
    expect(res.body.data).not.toHaveProperty("vsAverage");
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it("404s for an unknown product and 400s for an invalid slug", async () => {
    expect((await api.get("/api/products/does-not-exist").expect(404)).body.error.code).toBe("NOT_FOUND");
    expect((await api.get("/api/products/Bad_Slug").expect(400)).body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/products/compare", () => {
  it("returns products in the requested order and reports unknown slugs", async () => {
    const res = await api.get("/api/products/compare").query({ slugs: "jbl-flip-5,nope,sony-wh-1000xm4" }).expect(200);
    expect(res.body.data.map((p: Item) => p.slug)).toEqual(["jbl-flip-5", "sony-wh-1000xm4"]);
    expect(res.body.meta.missing).toEqual(["nope"]);
  });

  it("limits comparisons to four products", async () => {
    await api.get("/api/products/compare").query({ slugs: "a,b,c,d,e" }).expect(400);
    await api.get("/api/products/compare").expect(400);
  });
});
