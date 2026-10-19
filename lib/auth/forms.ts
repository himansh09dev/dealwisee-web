import { newPasswordSchema, publicUserSchema, registerSchema } from "@pricepilot/contracts";
import { z } from "zod";

export { loginSchema, passwordRules } from "@pricepilot/contracts";
export type { LoginInput } from "@pricepilot/contracts";

/** The API's register body plus a confirmation field that only the form needs. */
export const registerFormSchema = registerSchema
  .extend({ password: newPasswordSchema, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
export type RegisterFormInput = z.input<typeof registerFormSchema>;

export const authResponse = z.object({ data: z.object({ user: publicUserSchema }) });
