import { z } from "zod";

/* Shared by the forms (client validation) and the server actions (authoritative validation). */

const email = z.string().trim().min(1, "Enter your email address").pipe(z.email("Enter a valid email address"));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const passwordRules = [
  { test: (v: string) => v.length >= 10, label: "At least 10 characters" },
  { test: (v: string) => /[a-z]/i.test(v), label: "A letter" },
  { test: (v: string) => /\d/.test(v), label: "A number" },
] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(60, "Keep it under 60 characters"),
    email,
    password: z
      .string()
      .max(128, "Keep it under 128 characters")
      .refine((v) => passwordRules.every((r) => r.test(v)), "Use at least 10 characters with a letter and a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; fieldErrors?: Partial<Record<string, string[]>> };
