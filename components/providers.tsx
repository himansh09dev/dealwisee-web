"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * TanStack Query is only for server state fetched from the browser
 * (wishlist and comparison products). URL state lives in the URL, and
 * local UI state stays in components.
 */
export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session; useState keeps it stable across renders.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
