"use server";

import { z } from "zod";

import { authService } from "@/lib/auth/service";
import { registerSchema, signInSchema, type AuthResult } from "@/lib/auth/schemas";

/* Client validation is a convenience; these re-validate everything server-side. */

function invalid(error: z.ZodError): AuthResult {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export async function signInAction(input: unknown): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return authService.signIn(parsed.data);
}

export async function registerAction(input: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return authService.register(parsed.data);
}
