import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryList, stores } from "@/lib/catalog/schema";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <PageIntro eyebrow="Admin · Products" title="New product" />
      <div className="page-container">
        {/* The form generates row ids at render time, so it renders per request, not at build. */}
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <ProductForm
            target={null}
            categories={categoryList}
            stores={stores}
            defaultValues={{
              name: "",
              brand: "",
              slug: "",
              category: "audio",
              summary: "",
              imageSrc: "",
              imageAlt: "",
              listPrice: "",
              description: "",
              specs: [],
              offers: [{ storeId: "", price: "", shipping: "0", inStock: true }],
            }}
          />
        </Suspense>
      </div>
    </>
  );
}
