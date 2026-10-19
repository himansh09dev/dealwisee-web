import { z } from "zod";

export const roles = ["user", "admin"] as const;
export type Role = (typeof roles)[number];

/** Emails are compared case-insensitively; we store them trimmed and lowercased. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(254)
  .pipe(z.email("Enter a valid email address"))
  .transform((v) => v.toLowerCase());

export const passwordRules = [
  { test: (v: string) => v.length >= 10, label: "At least 10 characters" },
  { test: (v: string) => /[a-z]/i.test(v), label: "A letter" },
  { test: (v: string) => /\d/.test(v), label: "A number" },
] as const;

export const newPasswordSchema = z
  .string()
  .max(128, "Keep it under 128 characters")
  .refine((v) => passwordRules.every((r) => r.test(v)), "Use at least 10 characters with a letter and a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});
export type LoginInput = z.input<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60, "Keep it under 60 characters"),
  email: emailSchema,
  password: newPasswordSchema,
});
export type RegisterInput = z.input<typeof registerSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(roles),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
