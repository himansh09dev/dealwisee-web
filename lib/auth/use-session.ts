"use client";

import { publicUserSchema, type PublicUser, type Role } from "@pricepilot/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { clientApi } from "@/lib/api/client";

export const sessionKey = ["session"] as const;
const meResponse = z.object({ data: z.object({ user: publicUserSchema.nullable() }) });
const ackResponse = z.object({ data: z.unknown() });

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
