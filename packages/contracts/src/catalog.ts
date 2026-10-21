import { z } from "zod";

import { allowedImageHosts, categoryIds, isAllowedImageUrl, MAX_PAGE_SIZE, sortValues, storeIds } from "./taxonomy.ts";

/*
 * Catalog contract shared by the API (validation, persistence) and the web
 * app (rendering, form validation, response parsing). Money is always
 * integer cents.
 */

export const categoryIdSchema = z.enum(categoryIds);
export const storeIdSchema = z.enum(storeIds);

export const centsSchema = z.number().int().nonnegative().max(100_000_000);

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const specSchema = z.object({
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(120),
});

export const offerInputSchema = z.object({
  storeId: storeIdSchema,
  price: centsSchema.positive(),
  shipping: centsSchema,
  inStock: z.boolean(),
});

export const offerSchema = offerInputSchema.extend({ storeName: z.string() });

export const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine(isAllowedImageUrl, `Use a path under /images/ or an https:// image from ${allowedImageHosts.join(", ")}`),
  alt: z.string().trim().min(1, "Describe the image").max(200),
  /** Where the photograph came from, when known (e.g. its Unsplash page). */
  sourceUrl: z.url().optional(),
});

/** Body for POST /api/admin/products (and, partially, PATCH). */
export const productInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(60),
  category: categoryIdSchema,
  summary: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(2000),
  image: imageSchema,
  /** Manufacturer list price, when known. */
  listPrice: centsSchema.positive().optional(),
  offers: z
    .array(offerInputSchema)
    .min(1, "Add at least one offer")
    .max(20)
    .refine((o) => new Set(o.map((x) => x.storeId)).size === o.length, "Each store can appear only once"),
  specs: z.array(specSchema).max(30).default([]),
});
export type ProductInput = z.input<typeof productInputSchema>;
export type ProductInputParsed = z.output<typeof productInputSchema>;

// No defaults in a patch: an omitted field means "leave unchanged", so an
// empty body stays empty and is rejected.
export const productPatchSchema = productInputSchema
  .extend({ specs: z.array(specSchema).max(30) })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Send at least one field to update" });

/** A product as returned by the API. */
export const productSchema = productInputSchema.extend({
  id: objectIdSchema,
  offers: z.array(offerSchema),
  /** Lowest in-stock total (price + shipping), derived on write. */
  currentPrice: centsSchema,
  /** The previous week's lowest total, only when history exists. */
  previousPrice: centsSchema.optional(),
  /** Weekly lowest totals before this week, oldest first. Optional: never invented. */
  history: z.array(centsSchema).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Product = z.infer<typeof productSchema>;

/* ---------- Listing ---------- */

export const productSortSchema = z.enum(sortValues);

const list = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : String(v).split(",")), z.array(item).max(20));

/** Query for GET /api/products. Strict: invalid values are a 400, not silently ignored. */
export const productListQuerySchema = z
  .object({
    q: z.string().trim().max(100).default(""),
    category: list(categoryIdSchema),
    brand: list(z.string().trim().min(1).max(60)),
    minPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
    maxPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
    sort: productSortSchema.default("newest"),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(12),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: "minPrice must not exceed maxPrice",
    path: ["minPrice"],
  });
export type ProductListQuery = z.output<typeof productListQuerySchema>;

export const facetSchema = z.object({ value: z.string(), label: z.string(), count: z.number().int() });
export type Facet = z.infer<typeof facetSchema>;

export const productListMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  pageCount: z.number().int(),
  facets: z.object({ categories: z.array(facetSchema), brands: z.array(facetSchema) }),
});
export type ProductListMeta = z.infer<typeof productListMetaSchema>;

export const compareQuerySchema = z.object({
  slugs: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",").filter(Boolean) : v),
    z.array(slugSchema).min(1, "Pass at least one slug").max(4, "Compare up to 4 products"),
  ),
});
