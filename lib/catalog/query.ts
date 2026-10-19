import { z } from "zod";

import { categoryIdSchema, sortValues, type CategoryId, type ProductSort } from "@pricepilot/contracts";

/*
 * URL <-> query contract for /products. The URL is the source of truth for
 * listing state: parsing is tolerant (bad values fall back to defaults so a
 * mangled link still renders), serialising omits defaults so URLs stay short.
 */

export { sortValues, type ProductSort };

const sortLabels: Record<ProductSort, string> = {
  newest: "Recently added",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A to Z",
  drops: "Biggest drop vs average",
};

export const sortOptions = sortValues.map((value) => ({ value, label: sortLabels[value] }));

export const DEFAULT_SORT: ProductSort = "newest";
export const PAGE_SIZE = 12;

export type ProductQuery = {
  q: string;
  categories: CategoryId[];
  brands: string[];
  /** Whole dollars, inclusive; applied to the best total price */
  minPrice: number | null;
  maxPrice: number | null;
  sort: ProductSort;
  page: number;
  pageSize: number;
};

export const defaultQuery: ProductQuery = {
  q: "",
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  sort: DEFAULT_SORT,
  page: 1,
  pageSize: PAGE_SIZE,
};

type RawParams = Record<string, string | string[] | undefined>;

const asList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const priceSchema = z.coerce.number().int().min(0).max(100_000).nullable().catch(null);

export function parseProductQuery(params: RawParams): ProductQuery {
  const categories = asList(params.category).flatMap((c) => {
    const parsed = categoryIdSchema.safeParse(c);
    return parsed.success ? [parsed.data] : [];
  });
  const brands = asList(params.brand).map((b) => b.trim()).filter((b) => b.length > 0 && b.length <= 60);

  const rawMin = first(params.min);
  const rawMax = first(params.max);
  let minPrice = rawMin ? priceSchema.parse(rawMin) : null;
  let maxPrice = rawMax ? priceSchema.parse(rawMax) : null;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    categories: [...new Set(categories)],
    brands: [...new Set(brands)],
    minPrice,
    maxPrice,
    sort: z.enum(sortValues).catch(DEFAULT_SORT).parse(first(params.sort)),
    page: z.coerce.number().int().min(1).max(10_000).catch(1).parse(first(params.page) ?? 1),
    pageSize: PAGE_SIZE,
  };
}

export function serializeProductQuery(query: Partial<ProductQuery>): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  query.categories?.forEach((c) => params.append("category", c));
  query.brands?.forEach((b) => params.append("brand", b));
  if (query.minPrice != null) params.set("min", String(query.minPrice));
  if (query.maxPrice != null) params.set("max", String(query.maxPrice));
  if (query.sort && query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  return params;
}

export function productsHref(query: Partial<ProductQuery>): string {
  const qs = serializeProductQuery(query).toString();
  return qs ? `/products?${qs}` : "/products";
}

/** Filters only (search, category, brand, price) — what "Clear all" resets. */
export function hasActiveFilters(query: ProductQuery) {
  return (
    query.q !== "" ||
    query.categories.length > 0 ||
    query.brands.length > 0 ||
    query.minPrice !== null ||
    query.maxPrice !== null
  );
}

/** The API's query string for this listing. Prices: the URL uses dollars, the API uses cents. */
export function toApiQuery(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.categories.length > 0) params.set("category", query.categories.join(","));
  if (query.brands.length > 0) params.set("brand", query.brands.join(","));
  if (query.minPrice !== null) params.set("minPrice", String(query.minPrice * 100));
  if (query.maxPrice !== null) params.set("maxPrice", String(query.maxPrice * 100));
  params.set("sort", query.sort);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}
