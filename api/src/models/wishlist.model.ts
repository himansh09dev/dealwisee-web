import { model, Schema } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true },
);

// One entry per user+product; also serves "list my wishlist, newest first".
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1, createdAt: -1 });
// Lets a product deletion remove its wishlist entries efficiently.
wishlistSchema.index({ productId: 1 });

export const WishlistModel = model("WishlistItem", wishlistSchema);
