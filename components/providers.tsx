"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { toast } from "@/components/ui/toaster";
import { isApiError } from "@/lib/api/errors";
import { sessionKey } from "@/lib/auth/use-session";

/**
 * TanStack Query holds server state fetched from the browser (session,
 * wishlist, comparison products). URL state stays in the URL; local UI state
 * stays in components.
 *
 * A 401 from any request means the session expired or was revoked: drop the
 * cached user and personal data so the UI shows signed-out state, and tell
 * the user when it interrupted something they did.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const onUnauthenticated = (queryClient: QueryClient, announce: boolean) => {
      const wasSignedIn = Boolean(queryClient.getQueryData(sessionKey));
      queryClient.setQueryData(sessionKey, null);
      void queryClient.resetQueries({ queryKey: ["wishlist"] });
      if (announce && wasSignedIn) {
        toast("Your session has expired", {
          description: "Sign in again to continue.",
          action: (
            <Link
              href={`/login?next=${encodeURIComponent(window.location.pathname)}`}
              className="focus-ring ml-auto shrink-0 rounded-md bg-ink-inverse px-2.5 py-1 text-xs font-medium text-ink"
            >
              Sign in
            </Link>
          ),
        });
      }
    };

    const queryClient: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: (err) => {
          if (isApiError(err, 401)) onUnauthenticated(queryClient, false);
        },
      }),
      mutationCache: new MutationCache({
        onError: (err) => {
          if (isApiError(err, 401)) onUnauthenticated(queryClient, true);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          // Don't retry client errors (401/404/validation); do retry flaky network/5xx once.
          retry: (count, err) => count < 1 && !(isApiError(err) && err.status >= 400 && err.status < 500),
        },
      },
    });
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
