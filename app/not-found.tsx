import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

export default function NotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        as="h1"
        icon={<Compass />}
        title="We couldn't find that page"
        description="The link may be out of date, or the product may have left the catalog."
        action={
          <>
            <Button asChild>
              <Link href="/">Go to discovery</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/products">Browse all products</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
