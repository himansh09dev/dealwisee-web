import type { CatalogRepository } from "./repository";
import { seedRepository } from "./seed-repository";

/**
 * The catalog data source for server code (pages, route handlers, actions).
 * Currently the in-memory MOCK seed adapter; replaced by an HTTP adapter for
 * the Express API in the backend phase. Client components must not import
 * this — they go through `/api/*` (see lib/catalog/client.ts).
 */
export const catalog: CatalogRepository = seedRepository;

export type { CatalogRepository, CategorySummary, MutationResult } from "./repository";
export type { ProductPage, FacetCount } from "./filter";
