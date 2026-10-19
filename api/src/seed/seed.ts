import { emailSchema, newPasswordSchema } from "@pricepilot/contracts";

import { loadEnv } from "../config/env.ts";
import { connectDatabase, disconnectDatabase } from "../db/connect.ts";
import { hashPassword } from "../lib/password.ts";
import { ProductModel } from "../models/product.model.ts";
import { SessionModel } from "../models/session.model.ts";
import { UserModel } from "../models/user.model.ts";
import { WishlistModel } from "../models/wishlist.model.ts";
import { buildProductDocuments } from "./build.ts";
import { seedProducts } from "./data.ts";

/*
 * Resets the catalog to the seed data and upserts accounts whose details
 * come from environment variables (never from this file):
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD   → role "admin"
 *   SEED_USER_EMAIL  / SEED_USER_PASSWORD    → role "user" (optional)
 * Refuses to run against production.
 */

const env = loadEnv();
if (env.NODE_ENV === "production") {
  console.error("Refusing to seed with NODE_ENV=production.");
  process.exit(1);
}

await connectDatabase(env.MONGODB_URI);

await Promise.all([ProductModel.deleteMany({}), WishlistModel.deleteMany({})]);
await ProductModel.insertMany(buildProductDocuments(seedProducts), { timestamps: false });
console.log(`Seeded ${seedProducts.length} products.`);

async function upsertAccount(prefix: string, role: "admin" | "user", name: string) {
  const rawEmail = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!rawEmail || !password) {
    console.log(`Skipped ${role} account: set ${prefix}_EMAIL and ${prefix}_PASSWORD to create one.`);
    return;
  }
  const email = emailSchema.parse(rawEmail);
  newPasswordSchema.parse(password);
  const passwordHash = await hashPassword(password, env.SCRYPT_LOG_N);
  await UserModel.updateOne({ email }, { $set: { name, role, passwordHash } }, { upsert: true });
  // Changing a password invalidates existing sessions for that account.
  const user = await UserModel.findOne({ email });
  if (user) await SessionModel.deleteMany({ userId: user._id });
  console.log(`Upserted ${role} account ${email}.`); // the password is never printed
}

await upsertAccount("SEED_ADMIN", "admin", "PricePilot Admin");
await upsertAccount("SEED_USER", "user", "Demo Shopper");

await disconnectDatabase();
