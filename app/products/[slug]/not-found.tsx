import { PackageSearch } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

export default function ProductNotFound() {
  return (
    <div className="page-container py-16">
      <EmptyState
        as="h1"
        icon={<PackageSearch />}
        title="This product isn't in the catalog"
        description="It may have been removed, or the link has a typo."
        action={
          <Button asChild>
            <Link href="/products">Browse all products</Link>
          </Button>
        }
      />
    </div>
  );
}
