"use client";

import { useSyncExternalStore } from "react";

/*
 * TEMPORARY ADAPTER — a device-local list of product slugs in localStorage.
 *
 * Used for the wishlist and the comparison tray until accounts exist. It is
 * a convenience cache, not user data: it isn't authenticated, can be edited
 * by anyone with devtools, and never leaves the browser. The API-backed
 * replacement will keep the same hook surface (items + add/remove/toggle).
 *
 * Built on useSyncExternalStore so every subscriber stays in sync, including
 * other tabs via the `storage` event, without a React context or effects.
 */

const EMPTY: readonly string[] = Object.freeze([]);

export type AddResult = "added" | "exists" | "full";

export function createLocalListStore({ key, max = Infinity }: { key: string; max?: number }) {
  let cache: readonly string[] | null = null;
  const listeners = new Set<() => void>();

  function read(): readonly string[] {
    if (cache) return cache;
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      cache = Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string").slice(0, max)
        : [];
    } catch {
      cache = [];
    }
    return cache;
  }

  function write(next: readonly string[]) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage can be full or blocked (private mode); keep the in-memory copy.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    max,
    /** Server snapshot is empty, so server HTML and the first client render agree. */
    useItems: () => useSyncExternalStore(subscribe, read, () => EMPTY),
    add(slug: string): AddResult {
      const current = read();
      if (current.includes(slug)) return "exists";
      if (current.length >= max) return "full";
      write([slug, ...current]);
      return "added";
    },
    remove(slug: string) {
      write(read().filter((s) => s !== slug));
    },
    /** Put a removed item back where it was (for undo). */
    restore(slug: string, index: number) {
      const current = read().filter((s) => s !== slug);
      if (current.length >= max) return;
      write([...current.slice(0, index), slug, ...current.slice(index)]);
    },
    replace(oldSlug: string, newSlug: string) {
      const current = read();
      if (current.includes(newSlug)) return;
      write(current.map((s) => (s === oldSlug ? newSlug : s)));
    },
    indexOf(slug: string) {
      return read().indexOf(slug);
    },
    clear() {
      write([]);
    },
  };
}
