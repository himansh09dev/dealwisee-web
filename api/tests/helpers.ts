import { randomUUID } from "node:crypto";

import mongoose from "mongoose";
import supertest from "supertest";
import { afterAll, beforeAll, beforeEach, inject } from "vitest";

import { createApp } from "../src/app.ts";
import { loadEnv } from "../src/config/env.ts";
import { createLogger } from "../src/lib/logger.ts";
import { hashPassword } from "../src/lib/password.ts";
import { ProductModel } from "../src/models/product.model.ts";
import { UserModel } from "../src/models/user.model.ts";
import { buildProductDocuments } from "../src/seed/build.ts";
import { seedProducts } from "../src/seed/data.ts";

export const ORIGIN = "http://localhost:3000";
export const TEST_PASSWORD = "test-password-1";
const LOG_N = 10; // cheap scrypt for tests only

/** Connects to a fresh database for this test file and wipes it before each test. */
export function useTestDatabase() {
  beforeAll(async () => {
    const base = inject("mongoUri");
    await mongoose.connect(`${base.replace(/\/$/, "")}/${`t-${randomUUID()}`}`);
    await mongoose.syncIndexes();
  });
  beforeEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}

export function makeApp(overrides: Record<string, string> = {}) {
  const env = loadEnv({
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://unused-by-app",
    FRONTEND_ORIGIN: ORIGIN,
    SCRYPT_LOG_N: String(LOG_N),
    LOG_LEVEL: "silent",
    AUTH_RATE_LIMIT_MAX: "100",
    ...overrides,
  });
  return createApp(env, createLogger("silent"));
}

export async function seedCatalog() {
  await ProductModel.insertMany(buildProductDocuments(seedProducts), { timestamps: false });
}

export async function createUser(role: "user" | "admin", email = `${role}-${randomUUID()}@example.test`) {
  await UserModel.create({ name: `Test ${role}`, email, role, passwordHash: await hashPassword(TEST_PASSWORD, LOG_N) });
  return email;
}

/** A supertest agent that keeps cookies, already signed in as a new user with the given role. */
export async function signedInAgent(app: ReturnType<typeof makeApp>, role: "user" | "admin") {
  const email = await createUser(role);
  const agent = supertest.agent(app);
  await agent.post("/api/auth/login").send({ email, password: TEST_PASSWORD }).expect(200);
  return agent;
}

export async function productId(slug: string) {
  const doc = await ProductModel.findOne({ slug }).select("_id").lean();
  if (!doc) throw new Error(`fixture ${slug} missing`);
  return doc._id.toString();
}
