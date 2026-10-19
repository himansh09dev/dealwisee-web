import { ProductGridSkeleton } from "@/components/listing/listing-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the hero + first sections so content streams in without layout jumps. */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="page-container grid grid-cols-1 gap-12 pt-10 pb-16 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
        <div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="mt-6 h-40 w-full max-w-xl" />
          <Skeleton className="mt-6 h-16 w-full max-w-xl" />
          <Skeleton className="mt-9 h-14 w-full max-w-xl" />
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-xl lg:aspect-[5/6]" />
      </div>
      <div className="page-container py-12">
        <Skeleton className="mb-8 h-10 w-72" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
