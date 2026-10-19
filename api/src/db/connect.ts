import mongoose from "mongoose";

export async function connectDatabase(uri: string) {
  mongoose.set("strictQuery", true);
  // Fail fast instead of buffering queries forever when the DB is down.
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  // Build declared indexes (unique slugs/emails, wishlist compound key, text index).
  await mongoose.syncIndexes();
}

export function isDatabaseUp() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
