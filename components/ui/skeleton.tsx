import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Decorative placeholder. Announce loading on the container (aria-busy), not here. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--sunken)_0%,var(--line)_50%,var(--sunken)_100%)] bg-size-[200%_100%] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
