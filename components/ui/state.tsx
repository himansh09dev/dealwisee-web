import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StateProps = {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
  /** Headline level; pick the one that fits the page outline. */
  as?: "h1" | "h2" | "h3";
};

function StateBlock({
  icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
  as: Heading = "h2",
  role,
}: StateProps & { role?: "alert" }) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "mb-5 grid size-12 place-items-center rounded-full [&_svg]:size-5",
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-sunken text-ink-muted",
        )}
      >
        {icon}
      </div>
      <Heading className="font-display text-2xl tracking-tight text-ink">{title}</Heading>
      {description && (
        <div className="mt-2 max-w-sm text-sm text-pretty text-ink-muted">{description}</div>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <StateBlock {...props} />;
}

/** Same layout as EmptyState, announced to assistive tech when it appears. */
export function ErrorState(props: Omit<StateProps, "tone">) {
  return <StateBlock {...props} tone="danger" role="alert" />;
}
