import { MAX_WISHLIST_ITEMS, SESSION_COOKIE, type ProductInput } from "@pricepilot/contracts";
import mongoose, { Types } from "mongoose";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductModel } from "../src/models/product.model.ts";
import { SessionModel } from "../src/models/session.model.ts";
import { UserModel } from "../src/models/user.model.ts";
import { WishlistModel } from "../src/models/wishlist.model.ts";
import { createUser, makeApp, productId, seedCatalog, signedInAgent, TEST_PASSWORD, useTestDatabase } from "./helpers.ts";

useTestDatabase();
beforeEach(seedCatalog);
afterEach(() => vi.restoreAllMocks());

describe("rate limiting", () => {
  it("limits failed sign-ins per account even when the client rotates X-Forwarded-For", async () => {
    // Trusting proxies (as behind the Next.js proxy) means clients can claim any IP.
    const api = supertest(makeApp({ AUTH_ACCOUNT_RATE_LIMIT_MAX: "3", AUTH_RATE_LIMIT_MAX: "1000", TRUST_PROXY: "true" }));
    const email = await createUser("user");
    const attempt = (i: number) =>
      api.post("/api/auth/login").set("X-Forwarded-For", `203.0.113.${i}`).send({ email, password: "wrong-password-1" });
    for (let i = 0; i < 3; i++) await attempt(i).expect(401);
    expect((await attempt(99).expect(429)).body.error.code).toBe("RATE_LIMITED");
  });

  it("doesn't let failures on one account lock out another", async () => {
    const api = supertest(makeApp({ AUTH_ACCOUNT_RATE_LIMIT_MAX: "2", AUTH_RATE_LIMIT_MAX: "1000" }));
    const victim = await createUser("user");
    for (let i = 0; i < 3; i++) await api.post("/api/auth/login").send({ email: "attacker-target@example.test", password: "x-wrong-1" });
    await api.post("/api/auth/login").send({ email: victim, password: TEST_PASSWORD }).expect(200);
  });

  it("doesn't count successful sign-ins against the account", async () => {
    const api = supertest(makeApp({ AUTH_ACCOUNT_RATE_LIMIT_MAX: "2", AUTH_RATE_LIMIT_MAX: "1000" }));
    const email = await createUser("user");
    for (let i = 0; i < 4; i++) await api.post("/api/auth/login").send({ email, password: TEST_PASSWORD }).expect(200);
  });
});

describe("injection and mass assignment", () => {
  const app = makeApp();

  it("rejects operator objects where strings are expected", async () => {
    const res = await supertest(app).post("/api/auth/login").send({ email: { $gt: "" }, password: { $ne: null } }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("ignores operator-shaped query keys instead of passing them to MongoDB", async () => {
    const all = await supertest(app).get("/api/products").expect(200);
    const injected = await supertest(app).get("/api/products?brand[$ne]=Sony&q[$regex]=.*").expect(200);
    expect(injected.body.meta.total).toBe(all.body.meta.total);
  });

  it("derives server-owned fields instead of accepting them from admins", async () => {
    const admin = await signedInAgent(app, "admin");
    const body: ProductInput & Record<string, unknown> = {
      slug: "mass-assign",
      name: "Mass Assign",
      brand: "Test",
      category: "home",
      summary: "s",
      description: "d",
      image: { url: "/images/products/jbl-flip-5.jpg", alt: "x" },
      offers: [{ storeId: "harbor", price: 5000, shipping: 0, inStock: true }],
      currentPrice: 1,
      history: [1, 1, 1],
      _id: new Types.ObjectId().toString(),
      createdAt: "2000-01-01T00:00:00.000Z",
    };
    const res = await admin.post("/api/admin/products").send(body).expect(201);
    expect(res.body.data.currentPrice).toBe(5000);
    expect(res.body.data).not.toHaveProperty("history");
    expect(res.body.data.id).not.toBe(body._id);
    expect(res.body.data.createdAt.startsWith("2000")).toBe(false);
  });

  it("only accepts images from allowed hosts", async () => {
    const admin = await signedInAgent(app, "admin");
    const base = {
      slug: "image-host",
      name: "Image Host",
      brand: "Test",
      category: "home",
      summary: "s",
      description: "d",
      offers: [{ storeId: "harbor", price: 5000, shipping: 0, inStock: true }],
    };
    for (const url of ["https://evil.example/x.jpg", "http://images.unsplash.com/x.jpg", "/images/../../etc/passwd", "javascript:alert(1)"]) {
      const res = await admin.post("/api/admin/products").send({ ...base, image: { url, alt: "x" } }).expect(400);
      expect(res.body.error.details[0].path).toBe("image.url");
    }
    await admin
      .post("/api/admin/products")
      .send({ ...base, image: { url: "https://images.unsplash.com/photo-1?w=800", alt: "x" } })
      .expect(201);
  });
});

describe("sessions", () => {
  it("rejects an expired session even if the cookie is still sent", async () => {
    const app = makeApp();
    const agent = await signedInAgent(app, "user");
    await SessionModel.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await agent.get("/api/wishlist").expect(401);
  });

  it("never returns password hashes, even via the user list in a wishlist response", async () => {
    const app = makeApp();
    const agent = await signedInAgent(app, "user");
    await agent.post(`/api/wishlist/${await productId("jbl-flip-5")}`).expect(201);
    const me = await agent.get("/api/auth/me").expect(200);
    const list = await agent.get("/api/wishlist").expect(200);
    expect(JSON.stringify(me.body) + JSON.stringify(list.body)).not.toMatch(/passwordHash|scrypt\$/);
  });

  it("sets the Secure flag on the session cookie in production", async () => {
    const app = makeApp({ NODE_ENV: "production" });
    const email = await createUser("user");
    const res = await supertest(app).post("/api/auth/login").send({ email, password: TEST_PASSWORD }).expect(200);
    const cookie = [res.headers["set-cookie"]].flat().find((c) => String(c).startsWith(`${SESSION_COOKIE}=`));
    expect(cookie).toMatch(/; Secure/);
  });
});

describe("bounded wishlist", () => {
  it(`refuses more than ${MAX_WISHLIST_ITEMS} items but stays idempotent for saved ones`, async () => {
    const app = makeApp();
    const agent = await signedInAgent(app, "user");
    const user = await UserModel.findOne({ role: "user" }).lean();
    const existing = await productId("jbl-flip-5");
    await agent.post(`/api/wishlist/${existing}`).expect(201);
    await WishlistModel.insertMany(
      Array.from({ length: MAX_WISHLIST_ITEMS - 1 }, () => ({ userId: user?._id, productId: new Types.ObjectId() })),
    );
    const res = await agent.post(`/api/wishlist/${await productId("playstation-5")}`).expect(409);
    expect(res.body.error.message).toMatch(/full/);
    await agent.post(`/api/wishlist/${existing}`).expect(200);
  });
});

describe("safe error responses", () => {
  it("returns a generic 500 without internal details", async () => {
    vi.spyOn(ProductModel, "find").mockImplementation(() => {
      throw new Error("connection string mongodb://user:secret@db/x and stack details");
    });
    const res = await supertest(makeApp()).get("/api/products").expect(500);
    expect(res.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack|mongodb/);
  });

  it("rejects oversized and wrongly shaped bodies cleanly", async () => {
    const api = supertest(makeApp());
    const huge = { email: "a@example.test", password: "x".repeat(200_000) };
    expect((await api.post("/api/auth/login").send(huge).expect(413)).body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect((await api.post("/api/auth/login").send([1, 2, 3]).expect(400)).body.error.code).toBe("VALIDATION_ERROR");
  });

  it("answers 503 (not a stack trace) when the database is down", async () => {
    const api = supertest(makeApp());
    const uri = mongoose.connection.getClient().options.hosts.map((h) => `${h.host}:${h.port}`)[0];
    const dbName = mongoose.connection.db?.databaseName;
    await mongoose.disconnect();
    try {
      const products = await api.get("/api/products").expect(503);
      expect(products.body.error).toEqual({ code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable" });
      expect((await api.get("/api/health").expect(503)).body.data.db).toBe("down");
    } finally {
      await mongoose.connect(`mongodb://${uri}/${dbName}`);
    }
  });
});
