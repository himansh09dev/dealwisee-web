/* Zod-free parts of the response contract, safe to import from browser code. */

export const errorCodes = [
  "VALIDATION_ERROR",
  "MALFORMED_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "PAYLOAD_TOO_LARGE",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof errorCodes)[number];

export type FieldIssue = { path: string; message: string };

/** Name of the session cookie. Shared so the web app can check for its presence. */
export const SESSION_COOKIE = "pp_session";
