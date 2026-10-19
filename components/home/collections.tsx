import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/lib/catalog/types";

import { SectionHeader } from "./section-header";

export type CollectionCard = {
  title: string;
  description: string;
  href: string;
  /** Computed from the catalog, never typed in. */
  count: number;
  images: Product["image"][];
};

/**
 * Curated collections are saved filters: each one is a /products URL, so
 * the collection page *is* the listing page with those filters applied.
 */
export function Collections({ collections }: { collections: CollectionCard[] }) {
  const visible = collections.filter((c) => c.count > 0);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="collections-title" className="page-container py-12">
      <SectionHeader id="collections-title" index="03 — Collections" title="Shortcuts we’d start with" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="focus-ring group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-(--duration-base) hover:border-line-strong hover:shadow-md"
            >
              <div className="flex -space-x-3" aria-hidden>
                {c.images.slice(0, 3).map((img) => (
                  <span
                    key={img.url}
                    className="relative size-12 overflow-hidden rounded-full bg-sunken ring-2 ring-surface"
                  >
                    <Image src={img.url} alt="" fill sizes="3rem" className="object-cover" />
                  </span>
                ))}
              </div>
              <h3 className="mt-5 font-display text-xl tracking-tight text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                {c.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm text-ink-muted">{c.description}</p>
              <p className="mt-4 text-xs text-ink-subtle tabular-nums">
                {c.count} {c.count === 1 ? "product" : "products"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
