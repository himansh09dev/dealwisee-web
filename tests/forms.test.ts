import { describe, expect, it } from "vitest";

import { pageWindow } from "@/components/listing/pagination";
import { loginSchema, registerFormSchema } from "@/lib/auth/forms";
import { fromProduct, productFormSchema, slugify, toProductInput } from "@/lib/catalog/product-form";
import { productInputSchema, type Product } from "@pricepilot/contracts";

const product: Product = {
  id: "0123456789abcdef01234567",
  slug: "test-kettle",
  name: "Test Kettle",
  brand: "Testware",
  category: "home",
  summary: "1.7 L",
  description: "A kettle.",
  image: { url: "/images/products/kettle.jpg", alt: "A kettle", sourceUrl: "https://unsplash.com/photos/x" },
  listPrice: 6999,
  offers: [
    { storeId: "kettle", storeName: "Kettle & Crate", price: 5999, shipping: 0, inStock: true },
    { storeId: "harbor", storeName: "Harbor Supply", price: 4999, shipping: 550, inStock: false },
  ],
  specs: [{ label: "Capacity", value: "1.7 L" }],
  currentPrice: 5999,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
};

describe("product form", () => {
  it("round-trips a product into a valid API body without losing data", () => {
    const values = fromProduct(product);
    expect(productFormSchema.safeParse(values).success).toBe(true);
    const body = toProductInput(values, product.image.sourceUrl);
    expect(productInputSchema.parse(body)).toMatchObject({
      slug: product.slug,
      listPrice: 6999,
      image: product.image,
      offers: [
        { storeId: "kettle", price: 5999, shipping: 0, inStock: true },
        { storeId: "harbor", price: 4999, shipping: 550, inStock: false },
      ],
    });
  });

  it("rejects duplicate stores, bad money and unsafe image URLs", () => {
    const values = fromProduct(product);
    const result = productFormSchema.safeParse({
      ...values,
      imageSrc: "javascript:alert(1)",
      offers: [
        { storeId: "northline", price: "12.345", shipping: "0", inStock: true },
        { storeId: "northline", price: "10", shipping: "0", inStock: true },
      ],
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toEqual(expect.arrayContaining(["imageSrc", "offers.0.price", "offers"]));
  });

  it("slugifies names", () => {
    expect(slugify('MacBook Pro 13", M2 — 8 GB')).toBe("macbook-pro-13-m2-8-gb");
  });
});

describe("auth forms", () => {
  it("normalises the email on sign-in", () => {
    expect(loginSchema.parse({ email: "  Ana@Example.TEST ", password: "x" }).email).toBe("ana@example.test");
  });

  it("enforces password rules and matching confirmation", () => {
    const ok = { name: "Ana", email: "ana@example.test", password: "longenough1", confirmPassword: "longenough1" };
    expect(registerFormSchema.safeParse(ok).success).toBe(true);
    expect(registerFormSchema.safeParse({ ...ok, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    const mismatch = registerFormSchema.safeParse({ ...ok, confirmPassword: "different1" });
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
