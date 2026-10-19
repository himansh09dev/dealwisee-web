import { CategoryRail } from "@/components/home/category-rail";
import { Collections, type CollectionCard } from "@/components/home/collections";
import { ComparisonPreview } from "@/components/home/comparison-preview";
import { Hero } from "@/components/home/hero";
import { Method } from "@/components/home/method";
import { RecentlyAdded } from "@/components/home/recently-added";
import { TrendingProducts } from "@/components/home/trending-products";
import { catalog } from "@/lib/catalog";
import { defaultQuery, productsHref, type ProductQuery } from "@/lib/catalog/query";

// Editorial picks for the prototype; later these come from a curated API field.
const SPOTLIGHT = "sony-wh-1000xm4";
const COMPARISON = "polaroid-onestep-2";

const collectionDefs: { title: string; description: string; filter: Partial<ProductQuery> }[] = [
  { title: "Under $100", description: "Everything you can get delivered for less than $100.", filter: { maxPrice: 100 } },
  { title: "Apple, side by side", description: "Phones, laptops and watches from one ecosystem.", filter: { brands: ["Apple"] } },
  { title: "Kitchen & home", description: "The coffee setup and the lamp to drink it by.", filter: { categories: ["home"] } },
  { title: "Sneakers", description: "Everyday and running shoes, priced by total cost.", filter: { categories: ["footwear"] } },
];

export default async function HomePage() {
  const list = (changes: Partial<ProductQuery>) => catalog.listProducts({ ...defaultQuery, ...changes });

  const [spotlight, comparison, categories, drops, cheapest, newest, ...collectionPages] = await Promise.all([
    catalog.getProduct(SPOTLIGHT),
    catalog.getProduct(COMPARISON),
    catalog.listCategorySummaries(),
    list({ sort: "drops", pageSize: 8 }),
    list({ sort: "price-asc", pageSize: 8 }),
    list({ sort: "newest", pageSize: 8 }),
    ...collectionDefs.map((c) => list({ ...c.filter, pageSize: 3 })),
  ]);

  const collections: CollectionCard[] = collectionDefs.map((def, i) => {
    const page = collectionPages[i];
    return {
      title: def.title,
      description: def.description,
      href: productsHref(def.filter),
      count: page?.total ?? 0,
      images: page?.items.map((item) => item.product.image) ?? [],
    };
  });

  return (
    <>
      {spotlight && <Hero spotlight={spotlight} />}
      <CategoryRail categories={categories} />
      <TrendingProducts
        views={[
          { value: "drops", label: "Biggest drops", items: drops.items },
          { value: "price-asc", label: "Lowest price", items: cheapest.items },
          { value: "newest", label: "Newest", items: newest.items },
        ]}
      />
      <Collections collections={collections} />
      {comparison && <ComparisonPreview item={comparison} />}
      <RecentlyAdded items={newest.items.slice(0, 5)} />
      <Method />
    </>
  );
}
