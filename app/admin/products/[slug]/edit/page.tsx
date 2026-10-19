import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct } from "@/lib/catalog";
import { categoryList, stores } from "@/lib/catalog/schema";
import { fromProduct } from "@/lib/catalog/product-form";

export const metadata: Metadata = { title: "Edit product" };

async function EditForm({ params }: Pick<PageProps<"/admin/products/[slug]/edit">, "params">) {
  const { slug } = await params;
  const item = await getProduct(slug);
  if (!item) notFound();

  return (
    <>
      <PageIntro eyebrow="Admin · Products" title={`Edit ${item.product.brand} ${item.product.name}`} />
      <div className="page-container">
        <ProductForm
          target={{ id: item.product.id, sourceUrl: item.product.image.sourceUrl }}
          defaultValues={fromProduct(item.product)}
          categories={categoryList}
          stores={stores}
        />
      </div>
    </>
  );
}

export default function EditProductPage({ params }: PageProps<"/admin/products/[slug]/edit">) {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading product" className="page-container pt-14">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="mt-10 h-96 w-full" />
        </div>
      }
    >
      <EditForm params={params} />
    </Suspense>
  );
}
