import Link from "next/link";

import { cn } from "@/lib/utils";

/** The mark: a price line stepping down inside an ink tile — "the price, piloted lower". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" fill="var(--ink)" />
      <path
        d="M5 8.5h4.5v3.5h4.5v3.5H19"
        fill="none"
        stroke="var(--signal)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="15.5" r="1.75" fill="var(--ink-inverse)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("focus-ring flex items-center gap-2 rounded-md text-ink", className)}
      aria-label="PricePilot home"
    >
      <LogoMark />
      <span className="text-[1.0625rem] font-semibold tracking-tight">PricePilot</span>
    </Link>
  );
}
