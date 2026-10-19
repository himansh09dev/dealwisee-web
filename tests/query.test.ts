import { describe, expect, it } from "vitest";

import { defaultQuery, hasActiveFilters, parseProductQuery, productsHref, toApiQuery } from "@/lib/catalog/query";

describe("parseProductQuery", () => {
  it("returns defaults for empty params", () => {
    expect(parseProductQuery({})).toEqual(defaultQuery);
  });

  it("parses repeated params, trims search and dedupes", () => {
    const q = parseProductQuery({
      q: "  headphones ",
      category: ["audio", "audio", "phones"],
      brand: ["Sony", " Apple "],
      sort: "price-asc",
      page: "2",
    });
    expect(q).toMatchObject({
      q: "headphones",
      categories: ["audio", "phones"],
      brands: ["Sony", "Apple"],
      sort: "price-asc",
      page: 2,
    });
  });

  it("falls back on invalid values instead of throwing", () => {
    const q = parseProductQuery({ category: "spaceships", sort: "random", page: "-4", min: "abc" });
    expect(q.categories).toEqual([]);
    expect(q.sort).toBe("newest");
    expect(q.page).toBe(1);
    expect(q.minPrice).toBeNull();
  });

  it("swaps an inverted price range", () => {
    const q = parseProductQuery({ min: "500", max: "100" });
    expect([q.minPrice, q.maxPrice]).toEqual([100, 500]);
  });
});

describe("productsHref", () => {
  it("omits defaults and round-trips through the parser", () => {
    expect(productsHref({ ...defaultQuery })).toBe("/products");
    const href = productsHref({ ...defaultQuery, q: "lamp", categories: ["home"], maxPrice: 150, page: 3 });
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parseProductQuery(params)).toMatchObject({ q: "lamp", categories: ["home"], maxPrice: 150, page: 3 });
  });
});

describe("hasActiveFilters", () => {
  it("ignores sort and page", () => {
    expect(hasActiveFilters({ ...defaultQuery, sort: "name-asc", page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...defaultQuery, brands: ["Nike"] })).toBe(true);
  });
});

describe("toApiQuery", () => {
  it("converts dollars to cents and joins lists for the API", () => {
    const qs = new URLSearchParams(
      toApiQuery({ ...defaultQuery, q: "lamp", categories: ["home", "audio"], minPrice: 10, maxPrice: 150, page: 2 }),
    );
    expect(Object.fromEntries(qs)).toEqual({
      q: "lamp",
      category: "home,audio",
      minPrice: "1000",
      maxPrice: "15000",
      sort: "newest",
      page: "2",
      pageSize: "12",
    });
  });
});
