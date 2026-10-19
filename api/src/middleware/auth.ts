import { SESSION_COOKIE, type Role } from "@pricepilot/contracts";
import type { CookieOptions, NextFunction, Request, Response } from "express";

import { forbidden, unauthenticated } from "../lib/http-error.ts";
import { resolveSession } from "../services/auth.service.ts";

export function sessionCookieOptions(production: boolean, maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true, // not readable from JavaScript, so XSS can't steal it
    secure: production, // HTTPS-only in production
    sameSite: "lax", // not sent on cross-site POSTs (first CSRF layer; see csrf.ts)
    path: "/",
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  };
}

/** Attaches res.locals.user when the session cookie is valid. Never rejects on its own. */
export function authenticate(production: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string" && token.length > 0 && token.length < 200) {
      const user = await resolveSession(token);
      if (user) res.locals.user = user;
      // Expired or revoked: clear it so the browser stops sending a dead cookie.
      else res.clearCookie(SESSION_COOKIE, sessionCookieOptions(production));
    }
    next();
  };
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user) throw unauthenticated();
  next();
}

/** Authorization is decided here, on the server, for every request — never by the UI. */
export function requireRole(role: Role) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    if (!user) throw unauthenticated();
    if (user.role !== role) throw forbidden();
    next();
  };
}
