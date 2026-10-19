"use client";

import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export const menuSurface = cn(
  "z-50 min-w-48 overflow-hidden rounded-lg border border-line bg-surface p-1 text-ink shadow-lg",
  "origin-(--radix-popper-transform-origin)",
  "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
);

export const menuItem = cn(
  "relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none",
  "data-highlighted:bg-sunken data-disabled:pointer-events-none data-disabled:opacity-45",
  "[&_svg]:size-4 [&_svg]:text-ink-muted",
);

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(menuSurface, className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof MenuPrimitive.Item>) {
  return <MenuPrimitive.Item className={cn(menuItem, className)} {...props} />;
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      className={cn("eyebrow px-2.5 pt-2 pb-1.5 text-ink-subtle", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} {...props} />;
}
