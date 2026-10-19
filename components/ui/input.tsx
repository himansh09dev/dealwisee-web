import { Search } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const inputClasses = cn(
  "h-10 w-full min-w-0 rounded-md border border-line-control bg-surface px-3 text-base text-ink sm:text-sm",
  "placeholder:text-ink-subtle",
  "transition-[border-color,box-shadow] duration-(--duration-fast)",
  "hover:border-ink-muted",
  "focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/20 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20",
);

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(inputClasses, className)} {...props} />;
}

type SearchFieldProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  /** Visually hidden label; search fields still need an accessible name. */
  label: string;
  size?: "md" | "lg";
};

/**
 * A search input with a leading icon. Wrap in a <form role="search"> that
 * owns submission; this component only renders the field.
 */
export function SearchField({ label, size = "md", className, id, ...props }: SearchFieldProps) {
  const inputId = id ?? "search";
  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle",
          size === "lg" ? "left-4 size-5" : "size-4",
        )}
      />
      <input
        id={inputId}
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          inputClasses,
          "[&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-14 rounded-lg pl-12 text-base sm:text-base" : "pl-9",
        )}
        {...props}
      />
    </div>
  );
}
