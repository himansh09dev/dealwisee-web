import type { ProductPage } from "./filter";
import type { ProductQuery } from "./query";
import type { Category, CategoryId, Product, ProductWithInsight, Store } from "./schema";

/*
 * The boundary between UI and data. Pages and route handlers depend on this
 * interface only; `lib/catalog/index.ts` picks the implementation. Swapping
 * the seed adapter for an HTTP client to the Express API changes one line.
 */

export type CategorySummary = Category & { count: number; cover: Product["image"] };

export type MutationResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      error: {
        code: "READ_ONLY" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "UNAVAILABLE";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export interface CatalogRepository {
  listProducts(query: ProductQuery): Promise<ProductPage>;
  getProduct(slug: string): Promise<ProductWithInsight | null>;
  getProductsBySlugs(slugs: string[]): Promise<ProductWithInsight[]>;
  getRelatedProducts(slug: string, limit: number): Promise<ProductWithInsight[]>;
  listCategories(): Promise<Category[]>;
  /** Categories that currently have products, with a count and cover image. */
  listCategorySummaries(): Promise<CategorySummary[]>;
  getCategory(id: string): Promise<Category | null>;
  listStores(): Promise<Store[]>;
  listSlugs(): Promise<string[]>;

  createProduct(input: Product): Promise<MutationResult>;
  updateProduct(slug: string, input: Product): Promise<MutationResult>;
  deleteProduct(slug: string): Promise<MutationResult>;
}

export type { Category, CategoryId };
