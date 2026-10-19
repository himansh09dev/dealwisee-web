import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-sunken text-ink-muted",
        outline: "border border-line-strong text-ink-muted",
        signal: "bg-signal-soft text-signal-ink",
        rise: "bg-rise-soft text-rise",
        danger: "bg-danger-soft text-danger",
        ink: "bg-ink text-ink-inverse",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}
