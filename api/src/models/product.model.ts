import { categoryIds, storeIds } from "@pricepilot/contracts";
import { model, Schema, type InferSchemaType } from "mongoose";

/*
 * Offers are embedded: they're always read with their product, never on
 * their own, and are small. currentPrice/previousPrice/vsAverage are
 * derived from offers + history by the service on every write and stored
 * so listings can filter and sort on indexed fields.
 */

const offerSchema = new Schema(
  {
    storeId: { type: String, required: true, enum: storeIds },
    storeName: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    shipping: { type: Number, required: true, min: 0 },
    inStock: { type: Boolean, required: true },
  },
  { _id: false },
);

const specSchema = new Schema(
  { label: { type: String, required: true, maxlength: 40 }, value: { type: String, required: true, maxlength: 120 } },
  { _id: false },
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true, maxlength: 2048 },
    alt: { type: String, required: true, maxlength: 200 },
    sourceUrl: { type: String },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, required: true, enum: categoryIds },
    summary: { type: String, required: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 2000 },
    image: { type: imageSchema, required: true },
    listPrice: { type: Number, min: 1 },
    offers: {
      type: [offerSchema],
      required: true,
      validate: { validator: (v: unknown[]) => v.length > 0, message: "A product needs at least one offer" },
    },
    /** Weekly lowest totals, oldest first. Undefined (not []) when unknown. */
    history: { type: [Number], default: undefined },
    specs: { type: [specSchema], default: [] },
    currentPrice: { type: Number, required: true, min: 0 },
    previousPrice: { type: Number },
    vsAverage: { type: Number, default: null },
    /** Sort key for "biggest drops": vsAverage, or NO_HISTORY_RANK so products without history sort last. */
    dropRank: { type: Number, required: true },
  },
  { timestamps: true },
);

// Listing filters + sorts. Category/brand are the common facets; price and
// recency are the common sorts.
// Each listing sort has an index whose keys match it exactly, including the
// _id tie-break that keeps pagination stable (no repeats or gaps between
// pages). Category-filtered variants cover the most common filter. Catalog
// writes are rare (admin only), so extra indexes cost little.
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ currentPrice: 1, _id: 1 });
productSchema.index({ brand: 1, name: 1, _id: 1 });
productSchema.index({ dropRank: 1, _id: 1 });
productSchema.index({ category: 1, createdAt: -1, _id: -1 });
productSchema.index({ category: 1, currentPrice: 1, _id: 1 });
// Covers facet counting (group by category/brand, filter by price) without reading documents.
productSchema.index({ category: 1, brand: 1, currentPrice: 1 });
productSchema.index(
  { name: "text", brand: "text", summary: "text", description: "text", "specs.value": "text" },
  { weights: { name: 10, brand: 8, summary: 4, "specs.value": 2, description: 1 }, name: "product_text" },
);

export const NO_HISTORY_RANK = 1_000_000;
export const dropRankOf = (vsAverage: number | null) => vsAverage ?? NO_HISTORY_RANK;

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: import("mongoose").Types.ObjectId };
export const ProductModel = model("Product", productSchema);
