import type { Metadata } from "next";

import { CompareView } from "@/components/compare/compare-view";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Compare",
  description: "Line up two or three products to compare total prices and specifications.",
};

export default function ComparePage() {
  return (
    <>
      <PageIntro eyebrow="Compare" title="Side by side">
        Total prices, price context and specifications, aligned row by row.
      </PageIntro>
      <div className="page-container">
        <CompareView />
      </div>
    </>
  );
}
