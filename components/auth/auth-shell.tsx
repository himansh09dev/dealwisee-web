import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

/** Shared frame for sign-in and registration. */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="page-container grid grid-cols-1 gap-12 pt-10 md:pt-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
      <div className="mx-auto w-full max-w-md lg:mx-0">
        <p className="eyebrow text-ink-subtle">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink md:text-5xl">{title}</h1>
        <p className="mt-3 text-ink-muted">{lede}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">{footer}</div>
      </div>

      <aside className="hidden self-start rounded-xl bg-ink p-10 text-ink-inverse lg:block">
        <p className="eyebrow text-ink-inverse/60">With an account</p>
        <ul className="mt-6 space-y-6">
          {[
            ["Your wishlist, everywhere", "Saved products sync across devices instead of living in one browser."],
            ["Admin tools", "Team members with the admin role can manage the catalog."],
            ["Price alerts (coming later)", "Set a target price and hear about it when an offer drops below it."],
          ].map(([title, body]) => (
            <li key={title} className="border-t border-ink-inverse/20 pt-5">
              <p className="font-display text-xl">{title}</p>
              <p className="mt-1.5 text-sm text-ink-inverse/72">{body}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading form" className="grid gap-5">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
