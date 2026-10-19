import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Price, PriceDelta } from "@/components/product/price";
import { OfferTable } from "@/components/product/offer-table";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { ProductImage } from "@/components/product/product-image";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalog, getCategory, getPriceSeries, getProduct } from "@/lib/catalog/queries";

export function generateStaticParams() {
  return getCatalog().map(({ product }) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getProduct(slug);
  return item ? { title: `${item.product.brand} ${item.product.name}` } : {};
}

/**
 * Interim product page: real offers and history, minimal layout. The full
 * product-details design (specs, gallery, alerts) is a later phase.
 */
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  // params are URL data: read them inside Suspense so the route's App Shell
  // stays URL-independent and can be prefetched once for every product link.
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="page-container pt-8">
      <Skeleton className="h-3 w-40" />
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-10 w-4/5" />
          <Skeleton className="mt-8 h-16 w-full" />
          <Skeleton className="mt-8 h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const item = getProduct(slug);
  if (!item) notFound();
  const { product, insight } = item;
  const category = getCategory(product.category);

  return (
    <div className="page-container pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="focus-ring rounded-xs hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          {category && (
            <>
              <li>
                <Link href={`/products?category=${category.id}`} className="focus-ring rounded-xs hover:text-ink">
                  {category.name}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          )}
          <li aria-current="page" className="truncate text-ink">
            {product.brand}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <ProductImage image={product.image} priority sizes="(min-width: 1024px) 45vw, 100vw" className="rounded-xl" />

        <div>
          <p className="eyebrow text-ink-subtle">{product.brand}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-balance text-ink">{product.name}</h1>
          <p className="mt-2 text-ink-muted">{product.summary}</p>

          <div className="mt-6 flex items-end justify-between gap-4 border-y border-line py-5">
            <div>
              <p className="text-xs text-ink-muted">Lowest total at {insight.best.store.name}</p>
              <Price amount={insight.best.total} compareAt={product.listPrice} size="xl" className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <PriceDelta ratio={insight.vsAverage} />
              <WishlistButton slug={product.slug} productName={product.name} variant="inline" />
            </div>
          </div>

          <h2 className="mt-8 text-sm font-medium text-ink">Offers</h2>
          <OfferTable product={product} className="mt-2" />

          <h2 className="mt-8 mb-3 text-sm font-medium text-ink">12-week price history</h2>
          <PriceHistoryChart series={getPriceSeries(product)} />

          <p className="mt-8 rounded-lg bg-sunken px-4 py-3 text-xs text-ink-muted">
            Interim page. Specifications, store links and price alerts arrive with the product-details
            phase. Stores and prices are sample data.
          </p>
        </div>
      </div>
    </div>
  );
}
