import Link from "next/link";

import { Logo } from "./logo";
import { categoryLinks } from "./nav-config";

const columns = [
  {
    title: "Discover",
    links: [
      { href: "/products", label: "All products" },
      { href: "/compare", label: "Compare" },
      ...categoryLinks.slice(0, 3),
    ],
  },
  {
    title: "You",
    links: [
      { href: "/wishlist", label: "Wishlist" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Project",
    links: [{ href: "/design", label: "Design system" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="page-container grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-ink-muted">
            Compare total prices across stores, see how today stacks up against recent history, and
            keep a list of what you&rsquo;re waiting on.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="eyebrow text-ink-subtle">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring rounded-xs text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="page-container flex flex-col gap-2 py-6 text-xs text-ink-subtle sm:flex-row sm:justify-between">
          <p>
            Prototype: products and photography are real; stores and prices are sample data.
          </p>
          <p>
            Photography from{" "}
            <a
              href="https://unsplash.com/license"
              className="focus-ring rounded-xs underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              Unsplash
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
