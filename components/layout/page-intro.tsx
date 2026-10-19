import type { ReactNode } from "react";

/** Standard page opener for inner pages: eyebrow, serif H1, optional lede. */
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-container pt-10 pb-8 md:pt-14">
      <p className="eyebrow text-ink-subtle">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-balance text-ink md:text-5xl">
        {title}
      </h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-pretty text-ink-muted">{children}</div>}
    </div>
  );
}
