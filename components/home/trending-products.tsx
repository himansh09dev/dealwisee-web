import { ProductCard } from "@/components/product/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sortCatalog, type ProductSort, type ProductWithInsight } from "@/lib/catalog/queries";

import { SectionHeader } from "./section-header";

const views: { value: ProductSort; label: string }[] = [
  { value: "drops", label: "Biggest drops" },
  { value: "price", label: "Lowest price" },
  { value: "newest", label: "Newest" },
];

const LIMIT = 8;

/**
 * Sorting happens on the server; Radix Tabs only switches which pre-rendered
 * grid is visible, so no product data is shipped to the client for this.
 */
export function TrendingProducts({ catalog }: { catalog: ProductWithInsight[] }) {
  return (
    <section aria-labelledby="trending-title" className="page-container py-12">
      <Tabs defaultValue="drops">
        <SectionHeader
          id="trending-title"
          index="02 — Price watch"
          title="Worth a look this week"
          description="Ranked by today's best total against each product's 12-week average."
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
          <TabsContent key={v.value} value={v.value} className="mt-8 focus-ring rounded-md">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {sortCatalog(catalog, v.value)
                .slice(0, LIMIT)
                .map((item) => (
                  <li key={item.product.slug} className="flex">
                    <ProductCard {...item} className="w-full" />
                  </li>
                ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
