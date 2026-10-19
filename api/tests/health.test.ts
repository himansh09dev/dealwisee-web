import supertest from "supertest";
import { describe, expect, it } from "vitest";

import { makeApp, useTestDatabase } from "./helpers.ts";

useTestDatabase();
const api = supertest(makeApp());

describe("health and fallbacks", () => {
  it("reports DB status without internals", async () => {
    const res = await api.get("/api/health").expect(200);
    expect(res.body.data).toMatchObject({ status: "ok", db: "up" });
  });

  it("returns JSON 404s for unknown routes and sets security headers", async () => {
    const res = await api.get("/api/nope").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
