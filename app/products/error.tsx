"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/state";

export default function ProductsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-container py-16">
      <ErrorState
        as="h1"
        icon={<TriangleAlert />}
        title="Products didn't load"
        description="Something went wrong fetching the catalog. Your search and filters are kept in the URL, so retrying picks up where you left off."
        action={
          <>
            <Button onClick={retry}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to discovery</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
