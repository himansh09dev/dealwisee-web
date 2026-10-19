import type { ApiErrorBody } from "@pricepilot/contracts";
import { rateLimit } from "express-rate-limit";

/**
 * Limits credential guessing on login/register per client IP. The in-memory
 * store is fine for one instance; multiple instances need a shared store
 * (e.g. Redis) so limits apply across them.
 */
export function authRateLimit(options: { max: number; windowMs: number }) {
  const body: ApiErrorBody = {
    error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes and try again." },
  };
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: body,
  });
}
