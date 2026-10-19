import "server-only";

import type { z } from "zod";

import { ApiError, readEnvelope } from "./errors";

/** Server-only base URL of the Express API (never exposed to the browser). */
const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

type ServerApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** The incoming request's session cookie, for calls made on the user's behalf. */
  cookie?: string;
  signal?: AbortSignal;
};

export async function serverApi<T extends z.ZodType>(path: string, schema: T, options: ServerApiOptions = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal ?? AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "The catalog service is unreachable");
  }
  return readEnvelope(res, schema);
}
