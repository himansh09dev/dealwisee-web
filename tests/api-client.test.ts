import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError, readEnvelope } from "@/lib/api/errors";
import { afterSignInPath, safeNext } from "@/lib/auth/use-session";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("readEnvelope", () => {
  it("returns parsed data for success envelopes", async () => {
    const schema = z.object({ data: z.object({ ok: z.boolean() }) });
    await expect(readEnvelope(json(200, { data: { ok: true } }), schema)).resolves.toEqual({ data: { ok: true } });
  });

  it("throws ApiError with the server's code, message and field details", async () => {
    const res = json(400, {
      error: { code: "VALIDATION_ERROR", message: "Some fields are invalid", details: [{ path: "email", message: "Bad" }] },
    });
    const err = await readEnvelope(res, z.unknown()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: "VALIDATION_ERROR", details: [{ path: "email", message: "Bad" }] });
  });

  it("treats a non-envelope error body as a generic failure", async () => {
    const res = new Response("<html>Bad gateway</html>", { status: 502 });
    await expect(readEnvelope(res, z.unknown())).rejects.toMatchObject({ status: 502, code: "SERVICE_UNAVAILABLE" });
  });

  it("rejects success bodies that don't match the contract", async () => {
    const schema = z.object({ data: z.object({ id: z.string() }) });
    await expect(readEnvelope(json(200, { data: { id: 1 } }), schema)).rejects.toThrow();
  });
});

describe("safeNext", () => {
  it.each([
    ["/wishlist", "/wishlist"],
    ["/products?q=a", "/products?q=a"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    [null, "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe("afterSignInPath", () => {
  it("sends admins to the dashboard unless a page asked for them back", () => {
    expect(afterSignInPath("admin", {})).toBe("/admin/products");
    expect(afterSignInPath("admin", { from: "/products/jbl-flip-5" })).toBe("/admin/products");
    expect(afterSignInPath("admin", { next: "/wishlist" })).toBe("/wishlist");
  });

  it("returns shoppers to where they were", () => {
    expect(afterSignInPath("user", {})).toBe("/");
    expect(afterSignInPath("user", { from: "/products/jbl-flip-5" })).toBe("/products/jbl-flip-5");
    expect(afterSignInPath("user", { next: "/wishlist", from: "/compare" })).toBe("/wishlist");
  });

  it("ignores unsafe destinations", () => {
    expect(afterSignInPath("user", { next: "//evil.example", from: "https://evil.example" })).toBe("/");
    expect(afterSignInPath("admin", { next: "//evil.example" })).toBe("/admin/products");
  });
});
