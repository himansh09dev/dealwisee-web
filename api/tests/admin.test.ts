import type { ProductInput } from "@pricepilot/contracts";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { WishlistModel } from "../src/models/wishlist.model.ts";
import { makeApp, productId, seedCatalog, signedInAgent, useTestDatabase } from "./helpers.ts";

useTestDatabase();
const app = makeApp();
beforeEach(seedCatalog);

const newProduct: ProductInput = {
  slug: "test-kettle",
  name: "Test Kettle",
  brand: "Testware",
  category: "home",
  summary: "1.7 L · Temperature control",
  description: "A kettle used only by the test suite.",
  image: { url: "https://images.unsplash.com/photo-kettle?w=800", alt: "A silver kettle" },
  offers: [
    { storeId: "kettle", price: 5999, shipping: 0, inStock: true },
    { storeId: "harbor", price: 4999, shipping: 500, inStock: true },
    { storeId: "parcel", price: 3999, shipping: 0, inStock: false },
  ],
  specs: [{ label: "Capacity", value: "1.7 L" }],
};

describe("admin authorization", () => {
  it("rejects anonymous requests with 401 on every admin endpoint", async () => {
    const id = await productId("jbl-flip-5");
    await supertest(app).post("/api/admin/products").send(newProduct).expect(401);
    await supertest(app).patch(`/api/admin/products/${id}`).send({ name: "x" }).expect(401);
    await supertest(app).delete(`/api/admin/products/${id}`).expect(401);
  });

  it("rejects signed-in non-admins with 403 on every admin endpoint", async () => {
    const user = await signedInAgent(app, "user");
    const id = await productId("jbl-flip-5");
    await user.post("/api/admin/products").send(newProduct).expect(403);
    await user.patch(`/api/admin/products/${id}`).send({ name: "x" }).expect(403);
    await user.delete(`/api/admin/products/${id}`).expect(403);
  });
});

describe("admin product management", () => {
  it("creates a product and derives its current price from in-stock offers", async () => {
    const admin = await signedInAgent(app, "admin");
    const res = await admin.post("/api/admin/products").send(newProduct).expect(201);
    // 49.99 + 5.00 shipping beats 59.99; the 39.99 offer is out of stock.
    expect(res.body.data).toMatchObject({ slug: "test-kettle", currentPrice: 5499 });
    expect(res.body.data.offers[0].storeName).toBe("Kettle & Crate");
    expect(res.body.data).not.toHaveProperty("history");
    await supertest(app).get("/api/products/test-kettle").expect(200);
  });

  it("rejects duplicate slugs and invalid bodies", async () => {
    const admin = await signedInAgent(app, "admin");
    const dup = await admin.post("/api/admin/products").send({ ...newProduct, slug: "jbl-flip-5" }).expect(409);
    expect(dup.body.error.details[0].path).toBe("slug");

    const bad = await admin
      .post("/api/admin/products")
      .send({ ...newProduct, offers: [], image: { url: "javascript:alert(1)", alt: "" } })
      .expect(400);
    const paths = bad.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["offers", "image.url", "image.alt"]));
  });

  it("patches fields, recomputes prices and keeps history", async () => {
    const admin = await signedInAgent(app, "admin");
    const id = await productId("sony-wh-1000xm4");
    const res = await admin
      .patch(`/api/admin/products/${id}`)
      .send({ offers: [{ storeId: "voltmart", price: 19999, shipping: 0, inStock: true }] })
      .expect(200);
    expect(res.body.data.currentPrice).toBe(19999);
    expect(res.body.data.history).toHaveLength(11);
    await admin.patch(`/api/admin/products/${id}`).send({}).expect(400);
    await admin.patch("/api/admin/products/not-an-id").send({ name: "x" }).expect(400);
    await admin.patch("/api/admin/products/0123456789abcdef01234567").send({ name: "x" }).expect(404);
  });

  it("deletes a product and its wishlist entries", async () => {
    const admin = await signedInAgent(app, "admin");
    const id = await productId("jbl-flip-5");
    await admin.post(`/api/wishlist/${id}`).expect(201);
    await admin.delete(`/api/admin/products/${id}`).expect(200);
    await admin.delete(`/api/admin/products/${id}`).expect(404);
    expect(await WishlistModel.countDocuments({ productId: id })).toBe(0);
  });
});
