import type { Metadata } from "next";
import { Suspense } from "react";

import { PageIntro } from "@/components/layout/page-intro";
import { ActiveFilters } from "@/components/listing/active-filters";
import { EmptyResults } from "@/components/listing/empty-results";
import { FilterPanel } from "@/components/listing/filter-panel";
import { ListingProvider, PendingRegion } from "@/components/listing/listing-context";
import { ListingSkeleton } from "@/components/listing/listing-skeleton";
import { MobileFilters } from "@/components/listing/mobile-filters";
import { Pagination } from "@/components/listing/pagination";
import { SearchBox } from "@/components/listing/search-box";
import { SortSelect } from "@/components/listing/sort-select";
import { ProductCard } from "@/components/product/product-card";
import { catalog } from "@/lib/catalog";
import { parseProductQuery } from "@/lib/catalog/query";

export const metadata: Metadata = {
  title: "Discover products",
  description: "Search, filter and sort products by total price across stores.",
};

async function Listing({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const query = parseProductQuery(await searchParams);
  const result = await catalog.listProducts(query);
  const first = (result.page - 1) * result.pageSize + 1;
  const last = first + result.items.length - 1;

  return (
    <ListingProvider query={{ ...query, page: result.page }} total={result.total}>
      <div className="page-container grid grid-cols-1 gap-10 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel facets={result.facets} idPrefix="side" />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBox />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <MobileFilters facets={result.facets} />
              <SortSelect />
            </div>
          </div>

          <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted tabular-nums" aria-live="polite" aria-atomic="true">
              {result.total === 0
                ? "No products"
                : `Showing ${first}–${last} of ${result.total} ${result.total === 1 ? "product" : "products"}`}
            </p>
          </div>
          <div className="mt-2 mb-8">
            <ActiveFilters
              categories={result.facets.categories.map((f) => ({ id: f.value, name: f.label }))}
            />
          </div>

          <PendingRegion>
            {result.items.length === 0 ? (
              <EmptyResults />
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
                {result.items.map((item, i) => (
                  <li key={item.product.slug} className="flex">
                    <ProductCard {...item} priority={i < 4} className="w-full" />
                  </li>
                ))}
              </ul>
            )}
          </PendingRegion>

          <div className="mt-14">
            <Pagination query={query} page={result.page} pageCount={result.pageCount} />
          </div>
        </div>
      </div>
    </ListingProvider>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageIntro eyebrow="Discover" title="All products">
        Every price is the total you&rsquo;d pay, including shipping.
      </PageIntro>
      {/* searchParams are request-time data; the intro above prerenders as the static shell. */}
      <Suspense fallback={<ListingSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </>
  );
}
