import { Columns3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <>
      <PageIntro eyebrow="Compare" title="Side-by-side comparison" />
      <div className="page-container">
        <EmptyState
          icon={<Columns3 />}
          title="Comparison is coming in a later phase"
          description="You'll be able to pick up to four products and compare specs, total prices and price history side by side. Each product page already lists its offers."
          action={
            <Button asChild variant="secondary">
              <Link href="/">Browse products</Link>
            </Button>
          }
        />
      </div>
    </>
  );
}
