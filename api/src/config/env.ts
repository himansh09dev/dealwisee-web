import { z } from "zod";

/*
 * All configuration comes from the environment and is validated once at
 * startup, so a missing or malformed value fails fast with a clear message
 * instead of surfacing later as an obscure runtime error.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must be a mongodb:// or mongodb+srv:// URI")
    .refine(
      (v) => !/<[^>]*>/.test(v),
      "MONGODB_URI still contains a placeholder such as <db_password>. Put your real database user and password in api/.env",
    ),
  /** Comma-separated list of browser origins allowed by CORS and the CSRF origin check. */
  FRONTEND_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  /** Express "trust proxy" setting: how many proxy hops to trust for client IPs. */
  TRUST_PROXY: z.string().default("loopback"),
  /** Login + register requests per client IP per window. */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
  /** Failed sign-ins per account (email) per window, regardless of IP. */
  AUTH_ACCOUNT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(15 * 60 * 1000),
  /** scrypt cost (log2 N). 17 follows OWASP guidance; tests lower it for speed. */
  SCRYPT_LOG_N: z.coerce.number().int().min(10).max(20).default(17),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}
