"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/state";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Replaced by real error reporting (CloudWatch) in the observability phase.
    console.error(error);
  }, [error]);

  return (
    <div className="page-container py-16">
      <ErrorState
        as="h1"
        icon={<TriangleAlert />}
        title="Something went wrong"
        description="This part of the page failed to load. Trying again usually fixes it."
        action={
          <Button onClick={retry}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    </div>
  );
}
