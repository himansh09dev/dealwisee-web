import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { WishlistModel } from "../src/models/wishlist.model.ts";
import { makeApp, productId, seedCatalog, signedInAgent, useTestDatabase } from "./helpers.ts";

useTestDatabase();
const app = makeApp();
beforeEach(seedCatalog);

describe("wishlist", () => {
  it("requires authentication", async () => {
    const id = await productId("jbl-flip-5");
    await supertest(app).get("/api/wishlist").expect(401);
    await supertest(app).post(`/api/wishlist/${id}`).expect(401);
    await supertest(app).delete(`/api/wishlist/${id}`).expect(401);
  });

  it("adds idempotently, lists newest first, and removes", async () => {
    const agent = await signedInAgent(app, "user");
    const jbl = await productId("jbl-flip-5");
    const ps5 = await productId("playstation-5");

    await agent.post(`/api/wishlist/${jbl}`).expect(201);
    await agent.post(`/api/wishlist/${jbl}`).expect(200); // already saved: no duplicate
    await agent.post(`/api/wishlist/${ps5}`).expect(201);

    const list = await agent.get("/api/wishlist").expect(200);
    expect(list.body.data.map((p: { slug: string }) => p.slug)).toEqual(["playstation-5", "jbl-flip-5"]);
    expect(await WishlistModel.countDocuments()).toBe(2);

    await agent.delete(`/api/wishlist/${jbl}`).expect(200);
    await agent.delete(`/api/wishlist/${jbl}`).expect(200); // removing twice is fine
    const after = await agent.get("/api/wishlist").expect(200);
    expect(after.body.data).toHaveLength(1);
  });

  it("keeps each user's list separate, including deletes", async () => {
    const alice = await signedInAgent(app, "user");
    const bob = await signedInAgent(app, "user");
    const jbl = await productId("jbl-flip-5");
    await alice.post(`/api/wishlist/${jbl}`).expect(201);
    expect((await bob.get("/api/wishlist").expect(200)).body.data).toEqual([]);
    // Bob removing the same product id must not touch Alice's entry.
    await bob.delete(`/api/wishlist/${jbl}`).expect(200);
    expect((await alice.get("/api/wishlist").expect(200)).body.data).toHaveLength(1);
  });

  it("validates the product id and checks the product exists", async () => {
    const agent = await signedInAgent(app, "user");
    await agent.post("/api/wishlist/not-an-id").expect(400);
    await agent.post("/api/wishlist/0123456789abcdef01234567").expect(404);
  });

  it("enforces one entry per user and product at the database level", async () => {
    const agent = await signedInAgent(app, "user");
    const id = await productId("jbl-flip-5");
    await agent.post(`/api/wishlist/${id}`).expect(201);
    const entry = await WishlistModel.findOne().lean();
    await expect(WishlistModel.create({ userId: entry?.userId, productId: entry?.productId })).rejects.toMatchObject({
      code: 11000,
    });
  });
});
