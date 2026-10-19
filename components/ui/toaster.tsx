"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

/**
 * Mounted once in the root layout. Toasts render in an aria-live region,
 * pause on hover/focus, and can be reached with Alt+T.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="system"
      duration={6000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-lg border border-line bg-ink p-4 text-sm text-ink-inverse shadow-lg",
          title: "font-medium",
          description: "mt-0.5 text-ink-inverse/75",
          actionButton:
            "focus-ring ml-auto shrink-0 cursor-pointer rounded-md bg-ink-inverse px-2.5 py-1 text-xs font-medium text-ink",
          icon: "mt-0.5 [&_svg]:size-4",
        },
      }}
    />
  );
}
