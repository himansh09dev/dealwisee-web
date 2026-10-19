import type { ProductQuery } from "./query";
import type { Category, CategoryId, ProductWithInsight } from "./schema";

/*
 * Pure listing logic used by the seed adapter (and its tests). The Express
 * API will implement the same behaviour with MongoDB queries; these
 * functions document the expected semantics.
 */

export type FacetCount<T extends string = string> = { value: T; label: string; count: number };

export type ProductPage = {
  items: ProductWithInsight[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  facets: {
    categories: FacetCount<CategoryId>[];
    brands: FacetCount[];
  };
};

function normalise(text: string) {
  return text.toLocaleLowerCase("en-US").normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Every search term must appear somewhere in brand, name, summary or category. */
export function matchesSearch(item: ProductWithInsight, q: string, categoryName: string) {
  const terms = normalise(q).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const { product } = item;
  const haystack = normalise(
    [product.brand, product.name, product.summary, categoryName, ...product.specs.map((s) => s.value)].join(" "),
  );
  return terms.every((t) => haystack.includes(t));
}

type FilterKey = "q" | "categories" | "brands" | "price";

function matches(
  item: ProductWithInsight,
  query: ProductQuery,
  categoryNames: ReadonlyMap<string, string>,
  skip?: FilterKey,
) {
  const { product, insight } = item;
  if (skip !== "q" && !matchesSearch(item, query.q, categoryNames.get(product.category) ?? "")) return false;
  if (skip !== "categories" && query.categories.length > 0 && !query.categories.includes(product.category))
    return false;
  if (skip !== "brands" && query.brands.length > 0 && !query.brands.includes(product.brand)) return false;
  if (skip !== "price") {
    const dollars = insight.best.total / 100;
    if (query.minPrice !== null && dollars < query.minPrice) return false;
    if (query.maxPrice !== null && dollars > query.maxPrice) return false;
  }
  return true;
}

export function sortItems(items: ProductWithInsight[], sort: ProductQuery["sort"]) {
  const copy = [...items];
  const byName = (a: ProductWithInsight, b: ProductWithInsight) =>
    `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`);
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.insight.best.total - b.insight.best.total || byName(a, b));
    case "price-desc":
      return copy.sort((a, b) => b.insight.best.total - a.insight.best.total || byName(a, b));
    case "name-asc":
      return copy.sort(byName);
    case "drops":
      // Products without history can't be ranked by drop; they go last.
      return copy.sort(
        (a, b) =>
          (a.insight.history?.vsAverage ?? Infinity) - (b.insight.history?.vsAverage ?? Infinity) ||
          byName(a, b),
      );
    case "newest":
      return copy.sort((a, b) => b.product.addedAt.localeCompare(a.product.addedAt) || byName(a, b));
  }
}

export function queryProducts(
  all: ProductWithInsight[],
  query: ProductQuery,
  categories: Category[],
): ProductPage {
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const matching = all.filter((item) => matches(item, query, categoryNames));

  // Facet counts ignore their own dimension, so selecting "Audio" still shows
  // how many results picking "Phones" as well would add.
  const forCategories = all.filter((item) => matches(item, query, categoryNames, "categories"));
  const forBrands = all.filter((item) => matches(item, query, categoryNames, "brands"));

  // Every option stays listed (zero-count ones render disabled) so the panel
  // doesn't reshuffle as filters change. Categories with no products at all are hidden.
  const stocked = new Set(all.map((i) => i.product.category));
  const categoryFacets = categories
    .filter((c) => stocked.has(c.id))
    .map((c) => ({
      value: c.id,
      label: c.name,
      count: forCategories.filter((i) => i.product.category === c.id).length,
    }));

  const brandNames = [...new Set(all.map((i) => i.product.brand))].sort((a, b) => a.localeCompare(b));
  const brandFacets = brandNames.map((b) => ({
    value: b,
    label: b,
    count: forBrands.filter((i) => i.product.brand === b).length,
  }));

  const sorted = sortItems(matching, query.sort);
  const pageCount = Math.max(1, Math.ceil(sorted.length / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page,
    pageCount,
    pageSize: query.pageSize,
    facets: { categories: categoryFacets, brands: brandFacets },
  };
}

/** Same category first, then same brand, then closest in price. */
export function relatedProducts(all: ProductWithInsight[], target: ProductWithInsight, limit: number) {
  const price = target.insight.best.total;
  const score = (i: ProductWithInsight) =>
    (i.product.category === target.product.category ? 0 : 2) +
    (i.product.brand === target.product.brand ? 0 : 1) +
    Math.min(Math.abs(i.insight.best.total - price) / Math.max(price, 1), 0.99);
  return all
    .filter((i) => i.product.slug !== target.product.slug)
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}
