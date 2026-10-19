import { z } from "zod";

/*
 * Single source of truth for catalog shapes. Types are inferred from these
 * schemas, the admin form validates with them, and client fetches parse API
 * responses with them. When the Express API lands, this module moves to a
 * shared package so both sides validate against the same contract.
 */

export const categoryIds = [
  "audio",
  "phones",
  "computing",
  "gaming",
  "cameras",
  "wearables",
  "footwear",
  "home",
  "accessories",
] as const;

export const categoryIdSchema = z.enum(categoryIds);

/** The category taxonomy is app configuration, not catalog data. */
export const categoryLabels: Record<(typeof categoryIds)[number], string> = {
  audio: "Audio",
  phones: "Phones",
  computing: "Computing",
  gaming: "Gaming",
  cameras: "Cameras",
  wearables: "Wearables",
  footwear: "Footwear",
  home: "Home & Kitchen",
  accessories: "Accessories",
};

export const categoryList = categoryIds.map((id) => ({ id, name: categoryLabels[id] }));

/** Money is always integer cents. */
export const centsSchema = z.number().int().nonnegative();

export const storeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const offerSchema = z.object({
  storeId: z.string().min(1),
  price: centsSchema.positive(),
  shipping: centsSchema,
  inStock: z.boolean(),
});

export const specSchema = z.object({
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(120),
});

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const productImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().trim().min(1),
  /** Where the photograph came from, when known (e.g. its Unsplash page). */
  sourceUrl: z.url().optional(),
});

export const productSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(60),
  category: categoryIdSchema,
  summary: z.string().trim().min(1).max(140),
  image: productImageSchema,
  /** Manufacturer list price. Optional: only shown when the data has it. */
  listPrice: centsSchema.positive().optional(),
  addedAt: z.iso.date(),
  offers: z.array(offerSchema).min(1),
  /**
   * Lowest total for each of the previous weeks, oldest first. Optional:
   * products without history never show trend or "vs average" claims.
   */
  history: z.array(centsSchema).optional(),
  specs: z.array(specSchema),
});

export const pricedOfferSchema = offerSchema.extend({
  total: centsSchema,
  store: storeSchema,
});

export const priceHistoryInsightSchema = z.object({
  average: centsSchema,
  low: centsSchema,
  high: centsSchema,
  /** (best total − average) / average. Negative = cheaper than usual. */
  vsAverage: z.number(),
});

export const priceInsightSchema = z.object({
  best: pricedOfferSchema,
  /** All offers: in stock first, each group cheapest total first. */
  offers: z.array(pricedOfferSchema),
  highestTotal: centsSchema,
  storeCount: z.number().int(),
  inStockCount: z.number().int(),
  /** null when the product has no price history. */
  history: priceHistoryInsightSchema.nullable(),
});

export const productWithInsightSchema = z.object({
  product: productSchema,
  insight: priceInsightSchema,
});

export type CategoryId = z.infer<typeof categoryIdSchema>;
export type Store = z.infer<typeof storeSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type Spec = z.infer<typeof specSchema>;
export type Product = z.infer<typeof productSchema>;
export type PricedOffer = z.infer<typeof pricedOfferSchema>;
export type PriceInsight = z.infer<typeof priceInsightSchema>;
export type ProductWithInsight = z.infer<typeof productWithInsightSchema>;

export type Category = { id: CategoryId; name: string };
