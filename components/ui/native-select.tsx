import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { inputClasses } from "./input";

/**
 * Styled native <select>. Preferred inside forms (GET filters, admin) where
 * native behaviour — form submission without JS, mobile pickers — matters
 * more than custom option rendering. Use <Select> for toolbar controls.
 */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(inputClasses, "cursor-pointer appearance-none pr-9")} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
