import type { ReactNode } from "react";

import { FormAlert } from "@/components/ui/form-alert";

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
        <FormAlert tone="info" className="mt-6">
          Accounts launch with the API. Until then the form validates your input, and submitting
          shows a &ldquo;not available yet&rdquo; message; nothing is stored.
        </FormAlert>
        <div className="mt-8">{children}</div>
        <div className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">{footer}</div>
      </div>

      <aside className="hidden self-start rounded-xl bg-ink p-10 text-ink-inverse lg:block">
        <p className="eyebrow text-ink-inverse/60">With an account</p>
        <ul className="mt-6 space-y-6">
          {[
            ["Your wishlist, everywhere", "Saved products sync across devices instead of living in one browser."],
            ["Comparisons that keep", "Pick up a side-by-side comparison where you left it."],
            ["Price alerts", "Set a target price and hear about it when an offer drops below it (planned)."],
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
