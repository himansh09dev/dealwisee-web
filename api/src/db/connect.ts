import mongoose from "mongoose";

export async function connectDatabase(uri: string) {
  mongoose.set("strictQuery", true);
  // Fail fast instead of buffering queries forever when the DB is down.
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  // Build declared indexes (unique slugs/emails, wishlist compound key, text index).
  await mongoose.syncIndexes();
  await backfillDerivedFields();
}

/**
 * Idempotent backfill for fields added after data was seeded (dropRank in
 * Phase 4). A no-op once every document has them.
 */
async function backfillDerivedFields() {
  await mongoose.connection
    .collection("products")
    .updateMany({ dropRank: { $exists: false } }, [{ $set: { dropRank: { $ifNull: ["$vsAverage", 1_000_000] } } }]);
}

export function isDatabaseUp() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
