import {
  categoryLabels,
  derivePrices,
  productInputSchema,
  productSchema,
  storeName,
  vsAverage,
  type Product,
  type ProductInputParsed,
  type ProductListMeta,
  type ProductListQuery,
} from "@pricepilot/contracts";
import type { QueryFilter } from "mongoose";
import { Types } from "mongoose";

import { notFound } from "../lib/http-error.ts";
import { dropRankOf, ProductModel, type ProductDoc } from "../models/product.model.ts";
import { WishlistModel } from "../models/wishlist.model.ts";

type LeanProduct = ProductDoc & { createdAt: Date; updatedAt: Date };

/** Maps a stored document to the public contract (and verifies it matches). */
export function toProductDto(doc: LeanProduct): Product {
  return productSchema.parse({
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    brand: doc.brand,
    category: doc.category,
    summary: doc.summary,
    description: doc.description,
    image: {
      url: doc.image.url,
      alt: doc.image.alt,
      ...(doc.image.sourceUrl ? { sourceUrl: doc.image.sourceUrl } : {}),
    },
    ...(doc.listPrice != null ? { listPrice: doc.listPrice } : {}),
    offers: doc.offers.map((o) => ({
      storeId: o.storeId,
      storeName: o.storeName,
      price: o.price,
      shipping: o.shipping,
      inStock: o.inStock,
    })),
    ...(doc.history && doc.history.length > 0 ? { history: [...doc.history] } : {}),
    specs: doc.specs.map((s) => ({ label: s.label, value: s.value })),
    currentPrice: doc.currentPrice,
    ...(doc.previousPrice != null ? { previousPrice: doc.previousPrice } : {}),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  });
}

/** Fields derived from offers/history, recomputed on every write so they can't drift. */
function withDerived(input: ProductInputParsed, history?: number[]) {
  const offers = input.offers.map((o) => ({ ...o, storeName: storeName(o.storeId) }));
  const { currentPrice, previousPrice } = derivePrices({ offers, history });
  const ratio = vsAverage({ offers, history, currentPrice });
  return { ...input, offers, currentPrice, previousPrice, vsAverage: ratio, dropRank: dropRankOf(ratio) };
}

/**
 * MongoDB $text ORs terms by default; quoting each term makes every term
 * required, matching how people expect a search box to narrow results.
 */
function allTermsSearch(q: string) {
  return q
    .split(/\s+/)
    .map((t) => t.replace(/["\\-]/g, ""))
    .filter(Boolean)
    .map((t) => `"${t}"`)
    .join(" ");
}

// Sort specs match the indexes declared on the model; _id makes ties stable.
const sortSpecs: Record<ProductListQuery["sort"], Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { currentPrice: 1, _id: 1 },
  "price-desc": { currentPrice: -1, _id: -1 },
  "name-asc": { brand: 1, name: 1, _id: 1 },
  drops: { dropRank: 1, _id: 1 },
};

type FacetRow = { _id: string; count: number };

/**
 * One listing page. The page of items comes from an indexed find with
 * sort/skip/limit, so MongoDB reads only the documents it returns instead
 * of scanning and sorting the whole collection. Total and facet counts are
 * separate queries run in parallel. Facet counts ignore their own dimension:
 * picking "Audio" still shows how many results adding "Phones" would bring.
 */
export async function listProducts(query: ProductListQuery): Promise<{ items: Product[]; meta: ProductListMeta }> {
  const terms = allTermsSearch(query.q);
  const base: QueryFilter<LeanProduct> = {};
  if (terms) base.$text = { $search: terms };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    base.currentPrice = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  const byCategory = query.category.length > 0 ? { category: { $in: query.category } } : {};
  const byBrand = query.brand.length > 0 ? { brand: { $in: query.brand } } : {};
  const filter = { ...base, ...byCategory, ...byBrand };

  const page = (n: number) =>
    ProductModel.find(filter)
      .sort(sortSpecs[query.sort])
      .skip((n - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean<LeanProduct[]>();
  // An unfiltered facet count would otherwise scan every document; the
  // covering index answers it from index keys alone. When there is a filter,
  // the planner's own choice (a narrower index) is faster, so no hint.
  const facet = (match: QueryFilter<LeanProduct>, field: "category" | "brand") => {
    const pipeline = ProductModel.aggregate<FacetRow>([
      { $match: match },
      { $project: { _id: 0, category: 1, brand: 1 } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ]);
    return Object.keys(match).length === 0 ? pipeline.hint({ category: 1, brand: 1, currentPrice: 1 }) : pipeline;
  };
  const isUnfiltered = Object.keys(filter).length === 0;

  let pageNumber = query.page;
  const [firstItems, total, categoryRows, brandRows, allCategories, allBrands] = await Promise.all([
    page(pageNumber),
    // Unfiltered totals come from collection metadata instead of a scan.
    isUnfiltered ? ProductModel.estimatedDocumentCount() : ProductModel.countDocuments(filter),
    facet({ ...base, ...byBrand }, "category"),
    facet({ ...base, ...byCategory }, "brand"),
    ProductModel.distinct("category"),
    ProductModel.distinct("brand"),
  ]);
  let items = firstItems;

  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  // A stale link to a page that no longer exists shows the last page instead of nothing.
  if (pageNumber > pageCount) {
    pageNumber = pageCount;
    items = await page(pageNumber);
  }

  const stocked = new Set<string>(allCategories);
  const count = (rows: FacetRow[], value: string) => rows.find((r) => r._id === value)?.count ?? 0;
  const categories = Object.entries(categoryLabels)
    .filter(([id]) => stocked.has(id))
    .map(([id, label]) => ({ value: id, label, count: count(categoryRows, id) }));
  const brands = [...allBrands]
    .sort((a, b) => a.localeCompare(b))
    .map((b) => ({ value: b, label: b, count: count(brandRows, b) }));

  return {
    items: items.map(toProductDto),
    meta: { page: pageNumber, pageSize: query.pageSize, total, pageCount, facets: { categories, brands } },
  };
}

export async function getProductBySlug(slug: string) {
  const doc = await ProductModel.findOne({ slug }).lean<LeanProduct>();
  if (!doc) throw notFound("Product");
  return toProductDto(doc);
}

/** Products in the order requested; unknown slugs are reported, not fatal. */
export async function getProductsBySlugs(slugs: string[]) {
  const docs = await ProductModel.find({ slug: { $in: slugs } }).lean<LeanProduct[]>();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  return {
    items: slugs.flatMap((s) => {
      const d = bySlug.get(s);
      return d ? [toProductDto(d)] : [];
    }),
    missing: slugs.filter((s) => !bySlug.has(s)),
  };
}

export async function getProductsByIds(ids: Types.ObjectId[]) {
  const docs = await ProductModel.find({ _id: { $in: ids } }).lean<LeanProduct[]>();
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  return ids.flatMap((id) => {
    const d = byId.get(id.toString());
    return d ? [toProductDto(d)] : [];
  });
}

export async function createProduct(input: ProductInputParsed) {
  const doc = await ProductModel.create(withDerived(input));
  return toProductDto(doc.toObject<LeanProduct>());
}

export async function updateProduct(id: string, patch: Partial<ProductInputParsed>) {
  const doc = await ProductModel.findById(id);
  if (!doc) throw notFound("Product");
  const current = toProductDto(doc.toObject<LeanProduct>());
  // Validate the merged result as a whole so a partial update can't leave
  // the product inconsistent (e.g. an empty offers list).
  const merged = productInputSchema.parse({
    slug: current.slug,
    name: current.name,
    brand: current.brand,
    category: current.category,
    summary: current.summary,
    description: current.description,
    image: current.image,
    listPrice: current.listPrice,
    offers: current.offers.map(({ storeId, price, shipping, inStock }) => ({ storeId, price, shipping, inStock })),
    specs: current.specs,
    ...patch,
  });
  // Price history is recorded by the system, never edited by hand.
  doc.set({ ...withDerived(merged, current.history), listPrice: merged.listPrice ?? undefined });
  await doc.save();
  return toProductDto(doc.toObject<LeanProduct>());
}

export async function deleteProduct(id: string) {
  const doc = await ProductModel.findByIdAndDelete(id);
  if (!doc) throw notFound("Product");
  // No dangling wishlist entries for a product that no longer exists.
  await WishlistModel.deleteMany({ productId: doc._id });
}
