import { categories, products, stores } from "./data";
import { queryProducts, relatedProducts } from "./filter";
import { withInsight } from "./insight";
import type { CatalogRepository, CategorySummary, MutationResult } from "./repository";
import type { ProductWithInsight } from "./schema";

/*
 * MOCK ADAPTER — serves the seed catalog from memory.
 *
 * - Read methods behave like the future API (async, same shapes).
 * - Write methods deliberately do NOT persist: they return a READ_ONLY error,
 *   so the admin UI can be built and validated without pretending to save.
 * - CATALOG_SEED_LATENCY_MS (dev only) adds artificial delay to request-time
 *   reads, which makes loading states visible during development.
 */

const storeMap = new Map(stores.map((s) => [s.id, s]));
const catalog: ProductWithInsight[] = products.map((p) => withInsight(p, storeMap));

async function latency() {
  const ms = Number(process.env.CATALOG_SEED_LATENCY_MS ?? 0);
  if (process.env.NODE_ENV !== "production" && ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const readOnly: MutationResult = {
  ok: false,
  error: {
    code: "READ_ONLY",
    message:
      "Nothing was saved: the catalog is running on seed data. Saving products needs the API, which arrives in the next phase.",
  },
};

export const seedRepository: CatalogRepository = {
  async listProducts(query) {
    await latency();
    return queryProducts(catalog, query, categories);
  },

  async getProduct(slug) {
    return catalog.find((i) => i.product.slug === slug) ?? null;
  },

  async getProductsBySlugs(slugs) {
    await latency();
    const bySlug = new Map(catalog.map((i) => [i.product.slug, i]));
    // Preserve the caller's order (e.g. most recently saved first).
    return slugs.flatMap((s) => bySlug.get(s) ?? []);
  },

  async getRelatedProducts(slug, limit) {
    const target = catalog.find((i) => i.product.slug === slug);
    return target ? relatedProducts(catalog, target, limit) : [];
  },

  async listCategories() {
    return categories;
  },

  async listCategorySummaries() {
    return categories.flatMap((category): CategorySummary[] => {
      const items = products.filter((p) => p.category === category.id);
      const cover = items[0]?.image;
      return cover ? [{ ...category, count: items.length, cover }] : [];
    });
  },

  async getCategory(id) {
    return categories.find((c) => c.id === id) ?? null;
  },

  async listStores() {
    return stores;
  },

  async listSlugs() {
    return products.map((p) => p.slug);
  },
  async createProduct(input) {
    if (products.some((p) => p.slug === input.slug)) {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "A product with this slug already exists.",
          fieldErrors: { slug: ["Already in use"] },
        },
      };
    }
    return readOnly;
  },

  async updateProduct(slug) {
    if (!products.some((p) => p.slug === slug)) {
      return { ok: false, error: { code: "NOT_FOUND", message: "That product no longer exists." } };
    }
    return readOnly;
  },

  async deleteProduct(slug) {
    if (!products.some((p) => p.slug === slug)) {
      return { ok: false, error: { code: "NOT_FOUND", message: "That product no longer exists." } };
    }
    return readOnly;
  },
};
