import { describe, expect, it } from "vitest";

import { pageWindow } from "@/components/listing/pagination";
import { registerSchema, signInSchema } from "@/lib/auth/schemas";
import { products } from "@/lib/catalog/data";
import { fromProduct, productFormSchema, slugify, toProduct } from "@/lib/catalog/product-form";

describe("product form", () => {
  it("round-trips a product through form values without losing data", () => {
    for (const product of products) {
      const values = fromProduct(product);
      expect(productFormSchema.safeParse(values).success).toBe(true);
      expect(toProduct(values, product)).toEqual(product);
    }
  });

  it("rejects duplicate stores, bad money and unsafe image URLs", () => {
    const [first] = products;
    if (!first) throw new Error("fixture missing");
    const values = fromProduct(first);
    const bad = {
      ...values,
      imageSrc: "javascript:alert(1)",
      offers: [
        { storeId: "northline", price: "12.345", shipping: "0", inStock: true },
        { storeId: "northline", price: "10", shipping: "0", inStock: true },
      ],
    };
    const result = productFormSchema.safeParse(bad);
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toEqual(expect.arrayContaining(["imageSrc", "offers.0.price", "offers"]));
  });

  it("slugifies names", () => {
    expect(slugify('MacBook Pro 13", M2 — 8 GB')).toBe("macbook-pro-13-m2-8-gb");
  });
});

describe("auth schemas", () => {
  it("validates sign-in input", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "nope", password: "" }).success).toBe(false);
  });

  it("enforces password rules and matching confirmation", () => {
    const ok = { name: "Ana", email: "ana@example.com", password: "longenough1", confirmPassword: "longenough1" };
    expect(registerSchema.safeParse(ok).success).toBe(true);
    expect(registerSchema.safeParse({ ...ok, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    const mismatch = registerSchema.safeParse({ ...ok, confirmPassword: "different1" });
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("pageWindow", () => {
  it("shows first, last and neighbours with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});
