import { z } from "zod";

import {
  categoryIdSchema,
  imageSchema,
  slugSchema,
  specSchema,
  storeIdSchema,
  type Product,
  type ProductInput,
} from "@pricepilot/contracts";

/*
 * Admin form shape. Money is typed as dollars (what people type), validated
 * here, then converted to integer cents for the API contract. Input and
 * output types are identical, which keeps react-hook-form simple. The API
 * re-validates everything; this is for fast, field-level feedback.
 */

const money = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter an amount like 129 or 129.99");

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,6}(\.\d{1,2})?$/.test(v), "Enter an amount like 129 or 129.99");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name").max(120),
  brand: z.string().trim().min(1, "Enter a brand").max(60),
  slug: slugSchema,
  category: categoryIdSchema,
  summary: z.string().trim().min(1, "Add a one-line summary").max(140, "Keep it under 140 characters"),
  description: z.string().trim().min(1, "Add a description").max(2000, "Keep it under 2,000 characters"),
  imageSrc: imageSchema.shape.url,
  imageAlt: z.string().trim().min(1, "Describe what's in the photo").max(200),
  listPrice: optionalMoney,
  specs: z.array(specSchema).max(30),
  offers: z
    .array(
      z.object({
        storeId: z.union([storeIdSchema, z.literal("")]).refine((v): boolean => v !== "", "Choose a store"),
        price: money.refine((v) => Number(v) > 0, "Price must be above zero"),
        shipping: money,
        inStock: z.boolean(),
      }),
    )
    .min(1, "Add at least one offer")
    .refine((offers) => new Set(offers.map((o) => o.storeId)).size === offers.length, "Each store can appear only once"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

const toCents = (dollars: string) => Math.round(Number(dollars) * 100);
const toDollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Form values → API body. Price history is recorded by the system and never sent. */
export function toProductInput(values: ProductFormValues, sourceUrl?: string): ProductInput {
  return {
    slug: values.slug,
    name: values.name,
    brand: values.brand,
    category: values.category,
    summary: values.summary,
    description: values.description,
    image: { url: values.imageSrc, alt: values.imageAlt, ...(sourceUrl ? { sourceUrl } : {}) },
    ...(values.listPrice !== "" ? { listPrice: toCents(values.listPrice) } : {}),
    offers: values.offers.flatMap((o) =>
      o.storeId === "" ? [] : [{ storeId: o.storeId, price: toCents(o.price), shipping: toCents(o.shipping), inStock: o.inStock }],
    ),
    specs: values.specs,
  };
}

export function fromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    brand: product.brand,
    slug: product.slug,
    category: product.category,
    summary: product.summary,
    description: product.description,
    imageSrc: product.image.url,
    imageAlt: product.image.alt,
    listPrice: product.listPrice === undefined ? "" : toDollars(product.listPrice),
    specs: product.specs,
    offers: product.offers.map((o) => ({
      storeId: o.storeId,
      price: toDollars(o.price),
      shipping: toDollars(o.shipping),
      inStock: o.inStock,
    })),
  };
}

/** API field paths (e.g. "image.url", "offers.0.price") → form field names. */
export function formFieldForApiPath(path: string): string {
  if (path === "image.url") return "imageSrc";
  if (path === "image.alt") return "imageAlt";
  return path;
}
