import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const tones = {
  error: { icon: CircleAlert, className: "bg-danger-soft text-danger", role: "alert" },
  success: { icon: CircleCheck, className: "bg-signal-soft text-signal-ink", role: "status" },
  info: { icon: Info, className: "bg-sunken text-ink-muted", role: "status" },
} as const;

/** Form-level feedback (server errors, success, notices). Announced on change. */
export function FormAlert({
  tone,
  title,
  children,
  className,
}: {
  tone: keyof typeof tones;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass, role } = tones[tone];
  return (
    <div role={role} className={cn("flex gap-3 rounded-lg px-4 py-3 text-sm", toneClass, className)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>
      </div>
    </div>
  );
}
