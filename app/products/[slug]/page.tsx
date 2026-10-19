import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CompareButton } from "@/components/product/compare-button";
import { OfferTable } from "@/components/product/offer-table";
import { Price, PriceDelta } from "@/components/product/price";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalog } from "@/lib/catalog";
import { getPriceSeries } from "@/lib/catalog/insight";
import { formatDelta, formatPrice } from "@/lib/format";

export async function generateStaticParams() {
  return (await catalog.listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await catalog.getProduct(slug);
  if (!item) return { title: "Product not found" };
  const { product, insight } = item;
  const title = `${product.brand} ${product.name}`;
  const description = `${product.summary}. Compare ${insight.storeCount} offers from ${formatPrice(insight.best.total)} total.`;
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description, images: [{ url: product.image.src, alt: product.image.alt }] },
  };
}

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
          <Skeleton className="mt-8 h-24 w-full" />
          <Skeleton className="mt-8 h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const item = await catalog.getProduct(slug);
  if (!item) notFound();
  const { product, insight } = item;
  const [category, related] = await Promise.all([
    catalog.getCategory(product.category),
    catalog.getRelatedProducts(product.slug, 4),
  ]);
  const series = getPriceSeries(product);
  const listPrice = product.listPrice;
  const savings = listPrice !== undefined && listPrice > insight.best.total ? listPrice - insight.best.total : null;

  return (
    <div className="page-container pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/products" className="focus-ring rounded-xs hover:text-ink">
              Products
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/products?category=${category.id}`} className="focus-ring rounded-xs hover:text-ink">
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-ink">
            {product.brand} {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery product={product} />
        </div>

        <div className="min-w-0">
          <p className="eyebrow text-ink-subtle">{product.brand}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-balance text-ink md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-3 text-ink-muted">{product.summary}</p>

          <section aria-label="Price" className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-ink-muted">
                  Lowest total at <span className="font-medium text-ink">{insight.best.store.name}</span>
                </p>
                <Price amount={insight.best.total} size="xl" className="mt-1" />
              </div>
              {insight.history && <PriceDelta ratio={insight.history.vsAverage} />}
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              {listPrice !== undefined && (
                <div>
                  <dt className="inline text-ink-muted">List price: </dt>
                  <dd className="inline text-ink tabular-nums">
                    {formatPrice(listPrice)}
                    {savings !== null && (
                      <span className="text-signal-ink">
                        {" "}
                        ({formatPrice(savings)} less, {formatDelta(-savings / listPrice)})
                      </span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-ink-muted">Availability: </dt>
                <dd className="inline text-ink">
                  in stock at {insight.inStockCount} of {insight.storeCount} stores
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CompareButton slug={product.slug} productName={product.name} />
              <WishlistButton
                slug={product.slug}
                productName={product.name}
                variant="inline"
                className="size-12"
              />
            </div>
          </section>

          <section aria-labelledby="offers-title" className="mt-10">
            <h2 id="offers-title" className="font-display text-2xl tracking-tight text-ink">
              Offers
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Ranked by total cost, including shipping.</p>
            <OfferTable item={item} className="mt-3" />
          </section>

          <section aria-labelledby="history-title" className="mt-10">
            <h2 id="history-title" className="font-display text-2xl tracking-tight text-ink">
              Price history
            </h2>
            {series && insight.history ? (
              <>
                <p className="mt-1 text-sm text-ink-muted">
                  Weekly lowest total over {series.length} weeks. Range {formatPrice(insight.history.low)}
                  &ndash;{formatPrice(insight.history.high)}.
                </p>
                <PriceHistoryChart series={series} className="mt-4" />
              </>
            ) : (
              <p className="mt-2 rounded-lg bg-sunken px-4 py-3 text-sm text-ink-muted">
                No price history has been recorded for this product yet, so there&rsquo;s no trend to show.
              </p>
            )}
          </section>

          <section aria-labelledby="specs-title" className="mt-10">
            <h2 id="specs-title" className="font-display text-2xl tracking-tight text-ink">
              Specifications
            </h2>
            {product.specs.length > 0 ? (
              <dl className="mt-3 divide-y divide-line border-y border-line">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="grid grid-cols-[minmax(7rem,2fr)_3fr] gap-4 py-3 text-sm">
                    <dt className="text-ink-muted">{spec.label}</dt>
                    <dd className="text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No specifications listed.</p>
            )}
          </section>

          <p className="mt-10 text-xs text-ink-subtle">
            Stores, prices and price history on this page are sample data.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20 border-t border-ink pt-4">
          <p className="eyebrow text-ink">Related</p>
          <h2 id="related-title" className="mt-3 font-display text-3xl tracking-tight text-ink">
            You might also compare
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:gap-x-6">
            {related.map((r) => (
              <li key={r.product.slug} className="flex">
                <ProductCard {...r} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
