import "server-only";

import { publicUserSchema, SESSION_COOKIE } from "@pricepilot/contracts";
import { cookies } from "next/headers";
import { z } from "zod";

import { serverApi } from "@/lib/api/server";

const meResponse = z.object({ data: z.object({ user: publicUserSchema.nullable() }) });

/** The session cookie as a Cookie header, for forwarding to the API. */
export async function sessionCookieHeader() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? `${SESSION_COOKIE}=${token}` : undefined;
}

/**
 * The signed-in user according to the API, or null. Used for page-level UX
 * (redirects, hiding admin UI); the API independently authorizes every request.
 */
export async function getSessionUser() {
  const cookie = await sessionCookieHeader();
  if (!cookie) return null;
  return (await serverApi("/auth/me", meResponse, { cookie })).data.user;
}
