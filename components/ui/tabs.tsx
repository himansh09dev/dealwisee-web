"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

/** Segmented control styling: used for sort modes and view switches. */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-sunken p-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "focus-ring inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-ink-muted",
        "transition-[background-color,color,box-shadow] duration-(--duration-fast) hover:text-ink",
        "data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
