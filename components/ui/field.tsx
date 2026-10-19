import { Label as LabelPrimitive, Slot } from "radix-ui";
import { useId, type ComponentProps, type ReactElement } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-sm leading-none font-medium text-ink", className)}
      {...props}
    />
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /** A single form control; it receives id, aria-describedby and aria-invalid. */
  children: ReactElement;
};

/**
 * Wires a label, optional hint and error message to one control so screen
 * readers announce all three. Works with Input, textarea, select triggers.
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Slot.Root id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
        {children}
      </Slot.Root>
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
