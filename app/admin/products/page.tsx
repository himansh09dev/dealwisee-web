import { Pencil, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state";
import { catalog } from "@/lib/catalog";
import { parseProductQuery } from "@/lib/catalog/query";
import { categoryLabels } from "@/lib/catalog/schema";
import { formatPrice, formatShortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

/**
 * Filters are a plain GET form: works without JavaScript, and the URL is
 * shareable. Admin tables favour explicit "Apply" over live updates.
 */
async function ProductTable({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const query = { ...parseProductQuery(await searchParams), pageSize: 100, sort: "name-asc" as const };
  const [result, categories] = await Promise.all([catalog.listProducts(query), catalog.listCategories()]);
  const activeCategory = query.categories[0] ?? "";

  return (
    <>
      <form action="/admin/products" className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="admin-q">Search</Label>
          <Input id="admin-q" name="q" type="search" defaultValue={query.q} placeholder="Name, brand or spec" />
        </div>
        <div className="grid gap-1.5 sm:w-56">
          <Label htmlFor="admin-category">Category</Label>
          <NativeSelect id="admin-category" name="category" defaultValue={activeCategory}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            <Search aria-hidden />
            Apply
          </Button>
          {(query.q || activeCategory) && (
            <Button asChild variant="ghost">
              <Link href="/admin/products">Reset</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 mb-3 text-sm text-ink-muted" aria-live="polite">
        {result.total} {result.total === 1 ? "product" : "products"}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No products match"
          description="Try a different search or category."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/products">Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">Products in the catalog</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th scope="col" className="px-4 py-3 font-medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Best total</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Offers</th>
                <th scope="col" className="px-4 py-3 font-medium">Added</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map(({ product, insight }) => (
                <tr key={product.slug} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-sunken">
                        <Image src={product.image.src} alt="" fill sizes="2.5rem" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-[22rem] truncate font-medium text-ink">{product.name}</span>
                        <span className="block text-xs text-ink-muted">
                          {product.brand} · <span className="font-mono">{product.slug}</span>
                        </span>
                      </span>
                    </div>
                  </th>
                  <td className="px-4 py-3 text-ink-muted">{categoryLabels[product.category]}</td>
                  <td className="px-4 py-3 text-right text-ink tabular-nums">{formatPrice(insight.best.total)}</td>
                  <td className="px-4 py-3 text-right text-ink-muted tabular-nums">
                    {insight.inStockCount}/{insight.storeCount}
                    <span className="sr-only"> in stock</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted tabular-nums">{formatShortDate(product.addedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${product.slug}/edit`}>
                          <Pencil aria-hidden />
                          Edit<span className="sr-only"> {product.name}</span>
                        </Link>
                      </Button>
                      <DeleteProductButton slug={product.slug} name={product.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageIntro
        eyebrow="Admin"
        title="Products"
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus aria-hidden />
              New product
            </Link>
          </Button>
        }
      />
      <div className="page-container">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <ProductTable searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
