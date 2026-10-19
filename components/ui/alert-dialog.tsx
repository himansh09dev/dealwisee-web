"use client";

import { AlertDialog as AlertPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** For destructive confirmations: role="alertdialog", focus starts on Cancel. */
export const AlertDialog = AlertPrimitive.Root;
export const AlertDialogTrigger = AlertPrimitive.Trigger;
export const AlertDialogCancel = AlertPrimitive.Cancel;

export function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertPrimitive.Content>) {
  return (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <AlertPrimitive.Content
        className={cn(
          "fixed top-[20vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-line bg-surface p-6 text-ink shadow-lg outline-none",
          "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
          className,
        )}
        {...props}
      />
    </AlertPrimitive.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertPrimitive.Title>) {
  return <AlertPrimitive.Title className={cn("font-display text-2xl tracking-tight", className)} {...props} />;
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertPrimitive.Description>) {
  return <AlertPrimitive.Description className={cn("mt-2 text-sm text-ink-muted", className)} {...props} />;
}
