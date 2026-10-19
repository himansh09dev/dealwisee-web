import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-4 h-3 w-1/3" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-1.5 h-3 w-3/5" />
          <Skeleton className="mt-5 h-5 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

/** Mirrors the listing layout so nothing jumps when results stream in. */
export function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products" className="page-container">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[15rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-6 mb-8 h-5 w-40" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
