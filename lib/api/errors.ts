import { apiErrorSchema, type ErrorCode, type FieldIssue } from "@pricepilot/contracts";
import type { z } from "zod";

/** A non-2xx API response (or an unreachable API), with the server's safe message. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: FieldIssue[];

  constructor(status: number, code: ErrorCode, message: string, details: FieldIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isApiError = (e: unknown, status?: number): e is ApiError =>
  e instanceof ApiError && (status === undefined || e.status === status);

/** Parses `{ data, meta? }` with the given schema, or throws ApiError for error envelopes. */
export async function readEnvelope<T extends z.ZodType>(res: Response, schema: T): Promise<z.infer<T>> {
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiError(res.status, code, message, details);
    }
    throw new ApiError(res.status, res.status >= 500 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR", "Unexpected response from the API");
  }
  return schema.parse(body);
}
