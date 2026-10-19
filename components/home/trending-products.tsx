import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productsHref, type ProductSort } from "@/lib/catalog/query";
import type { ProductWithInsight } from "@/lib/catalog/types";

import { SectionHeader } from "./section-header";

export type TrendingView = { value: ProductSort; label: string; items: ProductWithInsight[] };

/**
 * Lists are fetched and sorted on the server; Radix Tabs only switches which
 * pre-rendered grid is visible, so no product data ships to the client here.
 */
export function TrendingProducts({ views }: { views: TrendingView[] }) {
  const [first] = views;
  if (!first || first.items.length === 0) return null;

  return (
    <section aria-labelledby="trending-title" className="page-container py-12">
      <Tabs defaultValue={first.value}>
        <SectionHeader
          id="trending-title"
          index="02 — Price watch"
          title="Worth a look this week"
          description="Ranked by today's best total against each product's recent average."
          aside={
            <TabsList aria-label="Sort products" className="self-start md:self-auto">
              {views.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          }
        />
        {views.map((v) => (
          <TabsContent key={v.value} value={v.value} className="focus-ring mt-8 rounded-md">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {v.items.map((item) => (
                <li key={item.product.slug} className="flex">
                  <ProductCard {...item} className="w-full" />
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center">
              <Link
                href={productsHref({ sort: v.value })}
                className="focus-ring rounded-xs text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                See all, sorted by {v.label.toLowerCase()}
              </Link>
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
