"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "focus-ring peer grid size-[1.125rem] shrink-0 cursor-pointer place-items-center rounded-xs border border-line-control bg-surface",
        "transition-colors duration-(--duration-fast) hover:border-ink-muted",
        "data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-ink-inverse",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
