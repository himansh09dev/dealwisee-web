import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** 1 … 4 5 6 … 12 — always first, last, and the current page's neighbours. */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => {
    const prev = sorted[i - 1];
    return prev !== undefined && p - prev > 1 ? (["gap", p] as const) : [p];
  });
}

const item =
  "focus-ring inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2.5 text-sm tabular-nums transition-colors";

/**
 * Numbered pages over infinite scroll: every page has a URL (shareable,
 * restorable with Back), keyboard and screen-reader users can reach the
 * footer, and there are no observers or duplicate-request races to manage.
 * Real links, so it works before hydration.
 */
export function Pagination({
  page,
  pageCount,
  href,
}: {
  page: number;
  pageCount: number;
  /** URL for a page number, keeping the caller's other URL state. */
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "text-ink hover:bg-ink/6")} rel="prev">
          <ChevronLeft aria-hidden className="size-4" />
          <span>Previous</span>
        </Link>
      ) : (
        <span className={cn(item, "text-ink-subtle")} aria-disabled="true">
          <ChevronLeft aria-hidden className="size-4" />
          Previous
        </span>
      )}

      <ol className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-ink-subtle">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(item, p === page ? "bg-ink text-ink-inverse" : "text-ink hover:bg-ink/6")}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      <p className="px-3 text-sm text-ink-muted tabular-nums sm:hidden">
        Page {page} of {pageCount}
      </p>

      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "text-ink hover:bg-ink/6")} rel="next">
          <span>Next</span>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-ink-subtle")} aria-disabled="true">
          Next
          <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}
