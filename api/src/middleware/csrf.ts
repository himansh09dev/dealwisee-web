import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../lib/http-error.ts";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/*
 * CSRF defence for cookie-authenticated, state-changing requests:
 *  1. SameSite=Lax cookies aren't sent on cross-site POST/PATCH/DELETE.
 *  2. Browsers send Origin (and Sec-Fetch-Site) on those requests; anything
 *     cross-site or from an unlisted origin is rejected here.
 *  3. Bodies must be JSON, which a cross-site <form> can't send without a
 *     CORS preflight (see requireJson).
 * Requests with neither header come from non-browser clients (server-side
 * Next.js, curl, tests), which can't carry a victim's cookies.
 */
export function originCheck(allowedOrigins: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.get("origin");
    const site = req.get("sec-fetch-site");
    if (site === "cross-site" || (origin !== undefined && !allowedOrigins.includes(origin))) {
      throw new HttpError(403, "FORBIDDEN", "Cross-site request blocked");
    }
    next();
  };
}

export function requireJson(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const hasBody = Number(req.get("content-length") ?? 0) > 0 || req.get("transfer-encoding") !== undefined;
  if (hasBody && !req.is("application/json")) {
    throw new HttpError(415, "MALFORMED_REQUEST", "Send the request body as application/json");
  }
  next();
}
