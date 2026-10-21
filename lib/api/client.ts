import { ApiError, readEnvelope, type Parser } from "./errors";

/**
 * Browser-side API calls. Same-origin /api/* (proxied to Express by Next),
 * so the HttpOnly session cookie is sent automatically and no CORS is needed.
 * Pass TanStack Query's `signal` so superseded requests are cancelled.
 */
export async function clientApi<T>(
  path: string,
  schema: Parser<T>,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; signal?: AbortSignal } = {},
) {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "SERVICE_UNAVAILABLE", "You appear to be offline. Check your connection and try again.");
  }
  return readEnvelope(res, schema);
}
