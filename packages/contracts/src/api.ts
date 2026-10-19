import { z } from "zod";

/*
 * Response envelope used by every endpoint:
 *   success → { data, meta? }
 *   failure → { error: { code, message, details? } }
 */

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

export const fieldIssueSchema = z.object({ path: z.string(), message: z.string() });
export type FieldIssue = z.infer<typeof fieldIssueSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes),
    message: z.string(),
    details: z.array(fieldIssueSchema).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export function envelope<T extends z.ZodType>(data: T) {
  return z.object({ data });
}
export function envelopeWithMeta<T extends z.ZodType, M extends z.ZodType>(data: T, meta: M) {
  return z.object({ data, meta });
}

/** Name of the session cookie. Shared so the web app can check for its presence. */
export const SESSION_COOKIE = "pp_session";
