import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  id: string;
  index: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  aside?: ReactNode;
  className?: string;
};

/**
 * Editorial section opener: a numbered hairline rule, serif title, and an
 * optional action. `id` is used as the section's aria-labelledby target.
 */
export function SectionHeader({
  id,
  index,
  title,
  description,
  action,
  aside,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("border-t border-ink pt-4", className)}>
      <p className="eyebrow text-ink-subtle">
        <span className="text-ink">{index}</span>
      </p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 id={id} className="font-display text-3xl tracking-tight text-balance text-ink md:text-4xl">
            {title}
          </h2>
          {description && <p className="mt-3 text-base text-pretty text-ink-muted">{description}</p>}
        </div>
        {aside}
        {action && (
          <Link
            href={action.href}
            className="focus-ring group inline-flex shrink-0 items-center gap-1.5 rounded-xs text-sm font-medium text-ink"
          >
            {action.label}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-(--duration-base) group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
