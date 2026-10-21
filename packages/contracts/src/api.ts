import { z } from "zod";

import { errorCodes } from "./api-codes.ts";

export * from "./api-codes.ts";

/*
 * Response envelope used by every endpoint:
 *   success → { data, meta? }
 *   failure → { error: { code, message, details? } }
 */

export const fieldIssueSchema = z.object({ path: z.string(), message: z.string() });

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

