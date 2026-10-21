import { MAX_WISHLIST_ITEMS } from "@pricepilot/contracts";
import { Types } from "mongoose";

import { HttpError, notFound } from "../lib/http-error.ts";
import { ProductModel } from "../models/product.model.ts";
import { WishlistModel } from "../models/wishlist.model.ts";
import { getProductsByIds } from "./product.service.ts";

export async function listWishlist(userId: string) {
  // Bounded by MAX_WISHLIST_ITEMS (enforced on add), so this can't grow without limit.
  const entries = await WishlistModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(MAX_WISHLIST_ITEMS)
    .select("productId")
    .lean();
  return getProductsByIds(entries.map((e) => e.productId));
}

/** Idempotent: adding twice is fine. Returns whether a new entry was created. */
export async function addToWishlist(userId: string, productId: string) {
  const [exists, alreadySaved, count] = await Promise.all([
    ProductModel.exists({ _id: productId }),
    WishlistModel.exists({ userId, productId }),
    WishlistModel.countDocuments({ userId }),
  ]);
  if (!exists) throw notFound("Product");
  if (!alreadySaved && count >= MAX_WISHLIST_ITEMS) {
    throw new HttpError(409, "CONFLICT", `Your wishlist is full (${MAX_WISHLIST_ITEMS} products). Remove some to add more.`);
  }
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
