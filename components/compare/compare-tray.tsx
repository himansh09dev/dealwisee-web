"use client";

import { ArrowRight, Columns3, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { COMPARE_MAX, compareList, useCompareList } from "@/lib/compare";

/** Floating shortcut to the comparison while products are selected. */
export function CompareTray() {
  const pathname = usePathname();
  const count = useCompareList().length;
  // Hidden where it would duplicate the page or cover a form's primary action.
  const hiddenOn = ["/compare", "/login", "/register"];
  if (count === 0 || hiddenOn.includes(pathname) || pathname.startsWith("/admin")) return null;

  return (
    <div
      role="region"
      aria-label="Comparison"
      className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-md items-center gap-2 rounded-full border border-line bg-ink py-1.5 pr-1.5 pl-4 text-ink-inverse shadow-lg animate-pop-in sm:bottom-5"
    >
      <Columns3 aria-hidden className="size-4 shrink-0 opacity-70" />
      <p className="flex-1 text-sm tabular-nums">
        {count} of {COMPARE_MAX} selected
      </p>
      <button
        type="button"
        onClick={() => compareList.clear()}
        className="focus-ring grid size-8 cursor-pointer place-items-center rounded-full text-ink-inverse/70 hover:bg-ink-inverse/10 hover:text-ink-inverse"
        aria-label="Clear comparison"
      >
        <X aria-hidden className="size-4" />
      </button>
      <Link
        href="/compare"
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-inverse px-4 text-sm font-medium text-ink"
      >
        Compare
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
