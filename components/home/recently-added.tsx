import Image from "next/image";
import Link from "next/link";

import { productsHref } from "@/lib/catalog/query";
import { categoryLabels } from "@/lib/catalog/schema";
import type { ProductWithInsight } from "@/lib/catalog/types";
import { formatPrice, formatShortDate } from "@/lib/format";

import { SectionHeader } from "./section-header";

/** An index-style list: a deliberate change of rhythm after the card grid. */
export function RecentlyAdded({ items }: { items: ProductWithInsight[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="page-container py-12">
      <SectionHeader
        id="recent-title"
        index="05 — New in the catalog"
        title="Recently added"
        action={{ href: productsHref({ sort: "newest" }), label: "See everything new" }}
      />
      <ol className="mt-6">
        {items.map(({ product, insight }, i) => (
          <li key={product.slug} className="border-b border-line">
            <Link
              href={`/products/${product.slug}`}
              className="focus-ring group grid grid-cols-[1.5rem_3.5rem_1fr_auto] items-center gap-x-4 rounded-md py-4 transition-colors hover:bg-surface/70 sm:grid-cols-[2rem_4rem_1fr_9rem_6rem_auto] sm:px-2"
            >
              <span className="font-mono text-xs text-ink-subtle tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative block aspect-square overflow-hidden rounded-md bg-sunken">
                <Image src={product.image.src} alt="" fill sizes="4rem" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-3">
                  {product.name}
                </span>
                <span className="block truncate text-xs text-ink-muted">{product.brand}</span>
              </span>
              <span className="hidden text-sm text-ink-muted sm:block">{categoryLabels[product.category]}</span>
              <span className="hidden text-xs text-ink-subtle tabular-nums sm:block">
                <span className="sr-only">Added </span>
                {formatShortDate(product.addedAt)}
              </span>
              <span className="text-right text-sm font-semibold text-ink tabular-nums">
                <span className="sr-only">from </span>
                {formatPrice(insight.best.total)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
