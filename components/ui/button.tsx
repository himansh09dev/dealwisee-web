import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-out-soft",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Ink is the primary action colour; green stays reserved for price signals.
        primary: "bg-ink text-ink-inverse hover:bg-ink/88",
        secondary:
          "border border-line-strong bg-surface text-ink shadow-xs hover:border-line-control hover:bg-paper",
        ghost: "text-ink hover:bg-ink/6",
        link: "text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-sm [&_svg]:size-4",
        md: "h-10 rounded-md px-4 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-lg px-5 text-base [&_svg]:size-5",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. a Next.js Link) with button styling. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: "button" })}
      {...props}
    />
  );
}

const iconSizes = {
  sm: "size-8 rounded-md [&_svg]:size-4",
  md: "size-10 rounded-md [&_svg]:size-[1.125rem]",
  lg: "size-12 rounded-lg [&_svg]:size-5",
} as const;

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  Pick<VariantProps<typeof buttonVariants>, "variant"> & {
    /** Accessible name. Required: an icon alone is not a label. */
    label: string;
    icon: ReactNode;
    size?: keyof typeof iconSizes;
  };

export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      data-slot="icon-button"
      aria-label={label}
      title={label}
      className={cn(buttonVariants({ variant }), "p-0", iconSizes[size], className)}
      {...props}
    >
      {icon}
    </button>
  );
}
