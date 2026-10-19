import { CategoryRail } from "@/components/home/category-rail";
import { ComparisonPreview } from "@/components/home/comparison-preview";
import { Hero } from "@/components/home/hero";
import { Method } from "@/components/home/method";
import { RecentlyAdded } from "@/components/home/recently-added";
import { TrendingProducts } from "@/components/home/trending-products";
import { getCatalog, getCategorySummaries, getProduct } from "@/lib/catalog/queries";

// Editorial picks for the prototype; later these come from a curated API field.
const SPOTLIGHT = "sony-wh-1000xm4";
const COMPARISON = "polaroid-onestep-2";

export default function HomePage() {
  const catalog = getCatalog();
  const spotlight = getProduct(SPOTLIGHT);
  const comparison = getProduct(COMPARISON);

  return (
    <>
      {spotlight && <Hero spotlight={spotlight} />}
      <CategoryRail categories={getCategorySummaries()} />
      <TrendingProducts catalog={catalog} />
      {comparison && <ComparisonPreview item={comparison} />}
      <RecentlyAdded catalog={catalog} />
      <Method />
    </>
  );
}
