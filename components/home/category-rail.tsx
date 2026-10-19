import Image from "next/image";
import Link from "next/link";

import type { CategorySummary } from "@/lib/catalog";

import { SectionHeader } from "./section-header";

export function CategoryRail({ categories }: { categories: CategorySummary[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-title" className="page-container py-12">
      <SectionHeader id="categories-title" index="01 — Categories" title="Start with a category" />
      {/* Horizontal scroll-snap rail on small screens, full grid on large ones */}
      <ul className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-6 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-9 lg:overflow-visible lg:px-0">
        {categories.map((c) => (
          <li key={c.id} className="w-32 shrink-0 snap-start lg:w-auto">
            <Link
              href={`/products?category=${c.id}`}
              className="focus-ring group block rounded-lg"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-sunken">
                <Image
                  src={c.cover.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 11vw, 8rem"
                  className="object-cover grayscale-[35%] transition-[filter,transform] duration-(--duration-slow) ease-out-soft group-hover:grayscale-0 motion-safe:group-hover:scale-105"
                />
              </div>
              <p className="mt-2.5 text-sm font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-3">
                {c.name}
              </p>
              <p className="text-xs text-ink-subtle tabular-nums">
                {c.count} {c.count === 1 ? "product" : "products"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
