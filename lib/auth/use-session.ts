"use client";

import type { PublicUser, Role } from "@pricepilot/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { clientApi } from "@/lib/api/client";

export const sessionKey = ["session"] as const;
/*
 * The session hook runs on every page (header), so it validates responses
 * with small hand-written checks instead of loading the schema library.
 */
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const meResponse = {
  parse(body: unknown): { data: { user: PublicUser | null } } {
    const user = isRecord(body) && isRecord(body.data) ? body.data.user : undefined;
    if (user === null) return { data: { user: null } };
    if (
      isRecord(user) &&
      typeof user.id === "string" &&
      typeof user.name === "string" &&
      typeof user.email === "string" &&
      (user.role === "user" || user.role === "admin")
    ) {
      return { data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } };
    }
    throw new Error("Unexpected /auth/me response");
  },
};
const ackResponse = { parse: (body: unknown) => body };

/** The signed-in user (null when signed out). Server state, owned by TanStack Query. */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async ({ signal }): Promise<PublicUser | null> =>
      (await clientApi("/auth/me", meResponse, { signal })).data.user,
    staleTime: 5 * 60_000,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => clientApi("/auth/logout", ackResponse, { method: "POST" }),
    onSettled: () => {
      queryClient.setQueryData(sessionKey, null);
      void queryClient.resetQueries({ queryKey: ["wishlist"] });
      router.refresh();
    },
  });
}

/** Only same-site relative paths: prevents ?next= being used as an open redirect. */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/**
 * Where to land after signing in or creating an account:
 * 1. `next`: a page sent the user to sign in and needs them back (admin gate,
 *    wishlist, "sign in to save"), so it always wins.
 * 2. Admins otherwise land on the dashboard.
 * 3. Everyone else returns to `from` (the page where they clicked "Sign in").
 */
export function afterSignInPath(role: Role, params: { next?: string | null; from?: string | null }) {
  const next = safeNext(params.next, "");
  if (next) return next;
  if (role === "admin") return "/admin/products";
  return safeNext(params.from);
}
