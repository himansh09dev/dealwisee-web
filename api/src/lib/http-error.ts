import type { ErrorCode, FieldIssue } from "@pricepilot/contracts";

/** An error that is safe to show to API clients. Anything else becomes a generic 500. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: FieldIssue[];

  constructor(status: number, code: ErrorCode, message: string, details?: FieldIssue[]) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (what = "Resource") => new HttpError(404, "NOT_FOUND", `${what} not found`);
export const unauthenticated = () => new HttpError(401, "UNAUTHENTICATED", "Sign in to continue");
export const forbidden = () => new HttpError(403, "FORBIDDEN", "You don't have permission to do that");
