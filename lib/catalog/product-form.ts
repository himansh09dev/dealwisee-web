import { z } from "zod";

import { categoryIdSchema, productSchema, slugSchema, specSchema, type Product } from "./schema";

/*
 * Admin form shape. Money is typed as text in dollars (what people type),
 * validated here, then converted to integer cents for the Product contract.
 * Input and output types are identical, which keeps react-hook-form simple.
 */

const money = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter an amount like 129 or 129.99");

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,6}(\.\d{1,2})?$/.test(v), "Enter an amount like 129 or 129.99");

const imageSrc = z
  .string()
  .trim()
  .min(1, "Add an image URL")
  .refine(
    (v) => v.startsWith("/images/") || /^https:\/\/[^\s]+$/.test(v),
    "Use an https:// URL or a path under /images/",
  );

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name").max(120),
  brand: z.string().trim().min(1, "Enter a brand").max(60),
  slug: slugSchema,
  category: categoryIdSchema,
  summary: z.string().trim().min(1, "Add a one-line summary").max(140, "Keep it under 140 characters"),
  imageSrc,
  imageAlt: z
    .string()
    .trim()
    .min(1, "Describe the image for people who can't see it")
    .max(200),
  listPrice: optionalMoney,
  addedAt: z.iso.date("Use a valid date"),
  specs: z.array(specSchema).max(20),
  offers: z
    .array(
      z.object({
        storeId: z.string().min(1, "Choose a store"),
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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Form values → Product. Price history is never invented: edits keep existing history only. */
export function toProduct(values: ProductFormValues, existing?: Product): Product {
  return productSchema.parse({
    slug: values.slug,
    name: values.name,
    brand: values.brand,
    category: values.category,
    summary: values.summary,
    image: { src: values.imageSrc, alt: values.imageAlt, sourceUrl: existing?.image.sourceUrl },
    listPrice: values.listPrice === "" ? undefined : toCents(values.listPrice),
    addedAt: values.addedAt,
    offers: values.offers.map((o) => ({
      storeId: o.storeId,
      price: toCents(o.price),
      shipping: toCents(o.shipping),
      inStock: o.inStock,
    })),
    history: existing?.history,
    specs: values.specs,
  });
}

export function fromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    brand: product.brand,
    slug: product.slug,
    category: product.category,
    summary: product.summary,
    imageSrc: product.image.src,
    imageAlt: product.image.alt,
    listPrice: product.listPrice === undefined ? "" : toDollars(product.listPrice),
    addedAt: product.addedAt,
    specs: product.specs,
    offers: product.offers.map((o) => ({
      storeId: o.storeId,
      price: toDollars(o.price),
      shipping: toDollars(o.shipping),
      inStock: o.inStock,
    })),
  };
}
