import { Construction } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state";
import { getCategory } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Discover" };

async function RequestSummary({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? getCategory(params.category) : undefined;

  const request = q ? `results for “${q}”` : category ? `the ${category.name} category` : "the full catalog";

  return (
    <EmptyState
      icon={<Construction />}
      title="Product listing is the next build step"
      description={
        <>
          Search, filters and sorting arrive in the product-listing phase. You asked for{" "}
          <strong className="font-medium text-ink">{request}</strong>, which will appear here.
        </>
      }
      action={
        <Button asChild variant="secondary">
          <Link href="/">Back to discovery</Link>
        </Button>
      }
    />
  );
}

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageIntro eyebrow="Discover" title="All products" />
      <div className="page-container">
        {/* searchParams are request-time data; the shell above prerenders. */}
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          <RequestSummary {...props} />
        </Suspense>
      </div>
    </>
  );
}
