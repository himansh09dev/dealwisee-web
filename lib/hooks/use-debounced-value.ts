"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delay` ms. Used where a
 * value drives a network request (e.g. picker search), so each keystroke
 * doesn't become a request.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
