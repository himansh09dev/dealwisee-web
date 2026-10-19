"use client";

import { useSyncExternalStore } from "react";

/*
 * Device-local wishlist until accounts and the API exist. A tiny external
 * store keeps every subscriber (header count, card hearts, wishlist page) in
 * sync, including across tabs via the `storage` event.
 */

const KEY = "pricepilot:wishlist:v1";
const EMPTY: readonly string[] = Object.freeze([]);

let cache: readonly string[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: readonly string[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be full or blocked (private mode); keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist() {
  // Server snapshot is empty, so server HTML and first client render agree.
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Returns true when the product is now saved. */
export function toggleWishlist(slug: string): boolean {
  const current = read();
  const saved = !current.includes(slug);
  write(saved ? [slug, ...current] : current.filter((s) => s !== slug));
  return saved;
}
