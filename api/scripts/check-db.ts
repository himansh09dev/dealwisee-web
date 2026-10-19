import mongoose from "mongoose";

import { loadEnv } from "../src/config/env.ts";

/*
 * `npm run db:check`: verifies MONGODB_URI without starting the API.
 * Prints the host, database and document counts; never prints credentials.
 */

const env = loadEnv();
const url = new URL(env.MONGODB_URI.replace(/^mongodb(\+srv)?:/, "https:"));
console.log(`host: ${url.hostname} · database: ${url.pathname.slice(1) || "(none, defaults to 'test')"}`);

const started = Date.now();
try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle after connecting");
  await db.command({ ping: 1 });
  console.log(`connected in ${Date.now() - started} ms to "${db.databaseName}"`);
  const collections = await db.listCollections().toArray();
  if (collections.length === 0) console.log("  database is empty (run `npm run seed`)");
  for (const c of collections) console.log(`  ${c.name}: ${await db.collection(c.name).countDocuments()} documents`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  // Never echo the URI's credentials back.
  console.error(`connection failed: ${message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, "mongodb://***@")}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
