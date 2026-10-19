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
import type { PipelineStage, QueryFilter } from "mongoose";
import { Types } from "mongoose";

import { notFound } from "../lib/http-error.ts";
import { ProductModel, type ProductDoc } from "../models/product.model.ts";
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
  return {
    ...input,
    offers,
    currentPrice,
    previousPrice,
    vsAverage: vsAverage({ offers, history, currentPrice }),
  };
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

const sortStages: Record<ProductListQuery["sort"], PipelineStage.FacetPipelineStage[]> = {
  newest: [{ $sort: { createdAt: -1, _id: -1 } }],
  "price-asc": [{ $sort: { currentPrice: 1, name: 1 } }],
  "price-desc": [{ $sort: { currentPrice: -1, name: 1 } }],
  "name-asc": [{ $sort: { brand: 1, name: 1 } }],
  // Products without history can't be ranked by drop; they go last.
  drops: [
    { $addFields: { _noHistory: { $cond: [{ $eq: ["$vsAverage", null] }, 1, 0] } } },
    { $sort: { _noHistory: 1, vsAverage: 1, name: 1 } },
    { $project: { _noHistory: 0 } },
  ],
};

type FacetRow = { _id: string; count: number };
type ListAggregate = { items: LeanProduct[]; total: { n: number }[]; categories: FacetRow[]; brands: FacetRow[] };

export async function listProducts(query: ProductListQuery): Promise<{ items: Product[]; meta: ProductListMeta }> {
  const terms = allTermsSearch(query.q);
  // $text must be the first stage; it plus price form the base every facet shares.
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

  const run = async (page: number) => {
    const [result] = await ProductModel.aggregate<ListAggregate>([
      { $match: base },
      {
        $facet: {
          items: [
            { $match: { ...byCategory, ...byBrand } },
            ...sortStages[query.sort],
            { $skip: (page - 1) * query.pageSize },
            { $limit: query.pageSize },
          ],
          total: [{ $match: { ...byCategory, ...byBrand } }, { $count: "n" }],
          // Facet counts ignore their own dimension: picking "Audio" still
          // shows how many results adding "Phones" would bring.
          categories: [{ $match: byBrand }, { $group: { _id: "$category", count: { $sum: 1 } } }],
          brands: [{ $match: byCategory }, { $group: { _id: "$brand", count: { $sum: 1 } } }],
        },
      },
    ]);
    return result ?? { items: [], total: [], categories: [], brands: [] };
  };

  const [allCategories, allBrands] = await Promise.all([
    ProductModel.distinct("category"),
    ProductModel.distinct("brand"),
  ]);

  let page = query.page;
  let result = await run(page);
  const total = result.total[0]?.n ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  // A stale link to a page that no longer exists shows the last page instead of nothing.
  if (page > pageCount) {
    page = pageCount;
    result = await run(page);
  }

  const stocked = new Set<string>(allCategories);
  const count = (rows: FacetRow[], value: string) => rows.find((r) => r._id === value)?.count ?? 0;
  const categories = Object.entries(categoryLabels)
    .filter(([id]) => stocked.has(id))
    .map(([id, label]) => ({ value: id, label, count: count(result.categories, id) }));
  const brands = [...allBrands]
    .sort((a, b) => a.localeCompare(b))
    .map((b) => ({ value: b, label: b, count: count(result.brands, b) }));

  return {
    items: result.items.map(toProductDto),
    meta: { page, pageSize: query.pageSize, total, pageCount, facets: { categories, brands } },
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
