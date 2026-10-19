"use server";

import { z } from "zod";

import { catalog, type MutationResult } from "@/lib/catalog";
import { productFormSchema, toProduct } from "@/lib/catalog/product-form";
import { slugSchema } from "@/lib/catalog/schema";

/*
 * Admin mutations. Input is re-validated here; never trust the client.
 *
 * ACCESS CONTROL IS NOT ENFORCED YET. Before these can change real data, the
 * API phase must check an authenticated admin session here (and the API must
 * enforce it again on its side).
 */

export async function saveProductAction(input: unknown, originalSlug: string | null): Promise<MutationResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Some fields need attention.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
    };
  }

  if (originalSlug === null) return catalog.createProduct(toProduct(parsed.data));

  const existing = await catalog.getProduct(originalSlug);
  if (!existing) return { ok: false, error: { code: "NOT_FOUND", message: "That product no longer exists." } };
  return catalog.updateProduct(originalSlug, toProduct(parsed.data, existing.product));
}

export async function deleteProductAction(slug: unknown): Promise<MutationResult> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Invalid product." } };
  return catalog.deleteProduct(parsed.data);
}
