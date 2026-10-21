import type { ApiErrorBody } from "@pricepilot/contracts";
import type { Request } from "express";
import { rateLimit } from "express-rate-limit";

/*
 * Two limits on the auth endpoints, because client IPs aren't fully trustworthy:
 *
 * 1. Per IP (login + register): slows credential spraying from one client.
 *    Correct only when TRUST_PROXY matches the real proxy chain: behind a
 *    proxy that doesn't add X-Forwarded-For, every client looks the same; if
 *    clients can set X-Forwarded-For themselves, they can rotate "IPs".
 * 2. Per account (login only): failed attempts per email, whatever the IP.
 *    This is the limit an attacker can't sidestep by spoofing headers, and
 *    successful sign-ins don't count, so the owner isn't locked out by it.
 *
 * In-memory stores are per instance; multiple instances need a shared store.
 */

const limited: ApiErrorBody = {
  error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes and try again." },
};

export function authRateLimit(options: { max: number; windowMs: number }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limited,
  });
}

function accountKey(req: Request) {
  const email: unknown = req.body?.email;
  return typeof email === "string" ? `acct:${email.trim().toLowerCase()}` : "acct:(none)";
}

export function loginAccountRateLimit(options: { max: number; windowMs: number }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: accountKey,
    skipSuccessfulRequests: true,
    message: limited,
  });
}
