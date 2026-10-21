import { errorCodes, type ErrorCode, type FieldIssue } from "@pricepilot/contracts/api-codes";

/** Anything with a `parse` method: a Zod schema, or a small hand-written parser. */
export type Parser<T> = { parse(input: unknown): T };

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

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isErrorCode = (v: unknown): v is ErrorCode => errorCodes.some((c) => c === v);

/** Reads `{ error: { code, message, details? } }` without a schema library. */
function readErrorBody(body: unknown): { code: ErrorCode; message: string; details: FieldIssue[] } | null {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const { code, message, details } = body.error;
  if (!isErrorCode(code) || typeof message !== "string") return null;
  const issues = Array.isArray(details)
    ? details.filter((d): d is FieldIssue => isRecord(d) && typeof d.path === "string" && typeof d.message === "string")
    : [];
  return { code, message, details: issues };
}

/** Parses `{ data, meta? }` with the given parser, or throws ApiError for error envelopes. */
export async function readEnvelope<T>(res: Response, parser: Parser<T>): Promise<T> {
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = readErrorBody(body);
    if (error) throw new ApiError(res.status, error.code, error.message, error.details);
    throw new ApiError(
      res.status,
      res.status >= 500 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR",
      "Unexpected response from the API",
    );
  }
  return parser.parse(body);
}
