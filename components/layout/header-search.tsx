"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/input";

import { suggestedSearches } from "./search-suggestions";

/**
 * Plain GET forms: search works before hydration and without JavaScript.
 * JS only adds the "/" shortcut on desktop.
 */
export function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form role="search" action="/products" className="relative hidden w-full max-w-xs md:block lg:max-w-sm">
      <SearchField
        ref={inputRef}
        id="header-search"
        name="q"
        label="Search products"
        placeholder="Search products, brands…"
        className="[&_input]:h-9 [&_input]:bg-surface/70 [&_input]:pr-9"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-xs border border-line-strong px-1.5 font-mono text-2xs text-ink-subtle lg:block"
      >
        /
      </kbd>
    </form>
  );
}

export function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton label="Search" icon={<Search aria-hidden />} className="md:hidden" />
      </DialogTrigger>
      <DialogContent className="top-4 max-w-none">
        <DialogTitle className="text-xl">Search PricePilot</DialogTitle>
        <form role="search" action="/products" onSubmit={() => setOpen(false)} className="mt-4">
          <SearchField id="mobile-search" name="q" label="Search products" placeholder="Search products, brands…" />
        </form>
        <p className="eyebrow mt-5 text-ink-subtle">Suggested</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {suggestedSearches.map((term) => (
            <li key={term}>
              <Link
                href={`/products?q=${encodeURIComponent(term)}`}
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex h-8 items-center rounded-full border border-line-strong px-3 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
