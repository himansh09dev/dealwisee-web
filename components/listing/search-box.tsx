"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { SearchField } from "@/components/ui/input";

import { useListing } from "./listing-context";

/**
 * Debounce, not throttle: we only care about the query once the user pauses
 * typing, so intermediate keystrokes are dropped rather than sampled. (Throttle
 * suits continuous signals that need regular updates — scroll position,
 * resize, drag — none of which drive this page.) Enter skips the wait.
 */
const DEBOUNCE_MS = 350;

export function SearchBox() {
  const { query, update } = useListing();
  const [value, setValue] = useState(query.q);
  /** The last q this component wrote to the URL. */
  const [sent, setSent] = useState(query.q);
  const [seenQ, setSeenQ] = useState(query.q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync from the URL only when the change came from elsewhere (chip
  // removed, "Clear all", Back button) — never clobber text being typed.
  // Adjusting state during render avoids an effect + extra paint.
  if (query.q !== seenQ) {
    setSeenQ(query.q);
    if (query.q !== sent) {
      setSent(query.q);
      setValue(query.q);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(next: string) {
    clearTimeout(timer.current);
    const q = next.trim();
    if (q === query.q) return;
    setSent(q);
    update({ q });
  }

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commit(value);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full">
      <SearchField
        id="listing-search"
        name="q"
        label="Search products"
        placeholder="Search by product, brand or feature"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="[&_input]:pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          className="focus-ring absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-ink-muted hover:bg-ink/6 hover:text-ink"
          aria-label="Clear search"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </form>
  );
}
