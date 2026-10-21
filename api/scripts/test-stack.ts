import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { MongoMemoryServer } from "mongodb-memory-server";

import { createApp } from "../src/app.ts";
import { loadEnv } from "../src/config/env.ts";
import { connectDatabase, disconnectDatabase } from "../src/db/connect.ts";
import { createLogger } from "../src/lib/logger.ts";
import { hashPassword } from "../src/lib/password.ts";
import { ProductModel } from "../src/models/product.model.ts";
import { UserModel } from "../src/models/user.model.ts";
import { buildProductDocuments } from "../src/seed/build.ts";
import { seedProducts } from "../src/seed/data.ts";
import { syntheticProducts } from "../src/seed/synthetic.ts";

/*
 * Self-contained API for end-to-end tests and measurements:
 * throwaway in-memory MongoDB + deterministic data + the real app.
 *   node scripts/test-stack.ts [--port 4100] [--origin http://localhost:3100] [--synthetic 0]
 * Ignores api/.env entirely, so it never touches a real database.
 */

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "4100" },
    origin: { type: "string", default: "http://localhost:3100" },
    synthetic: { type: "string", default: "0" },
  },
});

type TestUser = { name: string; email: string; password: string };
const users: Record<"admin" | "shopper" | "otherShopper", TestUser> = JSON.parse(
  readFileSync(new URL("../../e2e/test-users.json", import.meta.url), "utf8"),
);

const mongo = await MongoMemoryServer.create();
const env = loadEnv({
  NODE_ENV: "test",
  PORT: values.port,
  MONGODB_URI: mongo.getUri("pricepilot"),
  FRONTEND_ORIGIN: values.origin,
  // Many e2e sign-ins share one IP; the limiter itself is covered by API tests.
  AUTH_RATE_LIMIT_MAX: "1000",
  SCRYPT_LOG_N: "12",
  LOG_LEVEL: "warn",
});

await connectDatabase(env.MONGODB_URI);
const extra = Number(values.synthetic);
await ProductModel.insertMany(buildProductDocuments([...seedProducts, ...syntheticProducts(extra)]), {
  timestamps: false,
});
for (const key of ["admin", "shopper", "otherShopper"] as const) {
  const u = users[key];
  await UserModel.create({
    name: u.name,
    email: u.email,
    role: key === "admin" ? "admin" : "user",
    passwordHash: await hashPassword(u.password, env.SCRYPT_LOG_N),
  });
}

const server = createApp(env, createLogger(env.LOG_LEVEL)).listen(env.PORT, () => {
  console.log(`test API on :${env.PORT} · ${seedProducts.length + extra} products · origin ${values.origin}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => void disconnectDatabase().then(() => mongo.stop()).then(() => process.exit(0)));
  });
}
