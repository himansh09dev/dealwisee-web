"use server";

import { objectIdSchema, productSchema, type ErrorCode, type FieldIssue } from "@pricepilot/contracts";
import { updateTag } from "next/cache";
import { z } from "zod";

import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { sessionCookieHeader } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { productFormSchema, toProductInput } from "@/lib/catalog/product-form";

/*
 * Admin mutations run on the Next server and call the API with the user's
 * session cookie. The API decides authorization (401/403) on every call;
 * nothing here grants access. On success the catalog cache tag is expired
 * so public pages show the change on the next request.
 */

export type ActionResult =
  | { ok: true; slug: string }
  | { ok: false; code: ErrorCode; message: string; details: FieldIssue[] };

const productResponse = z.object({ data: productSchema });
const deleteResponse = z.object({ data: z.object({ id: z.string(), deleted: z.boolean() }) });

function failure(err: unknown): ActionResult {
  if (isApiError(err)) {
    const message =
      err.status === 401
        ? "Your session has expired. Sign in again to save changes."
        : err.status === 403
          ? "Your account doesn't have permission to manage products."
          : err.message;
    return { ok: false, code: err.code, message, details: err.details };
  }
  return { ok: false, code: "INTERNAL_ERROR", message: "Something went wrong. Please try again.", details: [] };
}

export async function saveProductAction(
  input: unknown,
  target: { id: string; sourceUrl?: string } | null,
): Promise<ActionResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return { ok: false, code: "VALIDATION_ERROR", message: "Some fields need attention.", details };
  }
  const body = toProductInput(parsed.data, target?.sourceUrl);
  const cookie = await sessionCookieHeader();
  try {
    const { data } = target
      ? await serverApi(`/admin/products/${objectIdSchema.parse(target.id)}`, productResponse, {
          method: "PATCH",
          body,
          cookie,
        })
      : await serverApi("/admin/products", productResponse, { method: "POST", body, cookie });
    updateTag(CATALOG_TAG);
    return { ok: true, slug: data.slug };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "Invalid product.", details: [] };
  try {
    await serverApi(`/admin/products/${parsed.data}`, deleteResponse, {
      method: "DELETE",
      cookie: await sessionCookieHeader(),
    });
    updateTag(CATALOG_TAG);
    return { ok: true, slug: "" };
  } catch (err) {
    return failure(err);
  }
}
