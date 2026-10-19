"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        className,
      )}
      {...props}
    />
  );
}

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** "center" for modals, "sheet" for the right-hand mobile panel. */
  placement?: "center" | "sheet";
  closeLabel?: string;
};

export function DialogContent({
  className,
  children,
  placement = "center",
  closeLabel = "Close",
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface text-ink shadow-lg outline-none",
          placement === "center" && [
            "top-[12vh] left-1/2 max-h-[76vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2",
            "rounded-xl border border-line p-6",
            "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          ],
          placement === "sheet" && [
            "inset-y-0 right-0 h-dvh w-[min(22rem,88vw)] border-l border-line",
            "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          ],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="focus-ring absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-md text-ink-muted transition-colors hover:bg-ink/6 hover:text-ink"
          aria-label={closeLabel}
        >
          <X aria-hidden className="size-[1.125rem]" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-2xl tracking-tight text-ink", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1.5 text-sm text-ink-muted", className)}
      {...props}
    />
  );
}
