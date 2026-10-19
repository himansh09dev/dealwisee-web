import { Types } from "mongoose";

import { notFound } from "../lib/http-error.ts";
import { ProductModel } from "../models/product.model.ts";
import { WishlistModel } from "../models/wishlist.model.ts";
import { getProductsByIds } from "./product.service.ts";

export async function listWishlist(userId: string) {
  const entries = await WishlistModel.find({ userId }).sort({ createdAt: -1 }).select("productId").lean();
  return getProductsByIds(entries.map((e) => e.productId));
}

/** Idempotent: adding twice is fine. Returns whether a new entry was created. */
export async function addToWishlist(userId: string, productId: string) {
  const exists = await ProductModel.exists({ _id: productId });
  if (!exists) throw notFound("Product");
  const result = await WishlistModel.updateOne(
    { userId, productId },
    { $setOnInsert: { userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) } },
    { upsert: true },
  );
  return { created: result.upsertedCount === 1 };
}

/** Idempotent: removing something that isn't there is not an error. */
export async function removeFromWishlist(userId: string, productId: string) {
  const result = await WishlistModel.deleteOne({ userId, productId });
  return { removed: result.deletedCount === 1 };
}
