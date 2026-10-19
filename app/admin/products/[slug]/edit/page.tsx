import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/skeleton";
import { catalog } from "@/lib/catalog";
import { fromProduct } from "@/lib/catalog/product-form";

export const metadata: Metadata = { title: "Edit product" };

export async function generateStaticParams() {
  return (await catalog.listSlugs()).map((slug) => ({ slug }));
}

async function EditForm({ params }: Pick<PageProps<"/admin/products/[slug]/edit">, "params">) {
  const { slug } = await params;
  const [item, stores, categories] = await Promise.all([
    catalog.getProduct(slug),
    catalog.listStores(),
    catalog.listCategories(),
  ]);
  if (!item) notFound();

  return (
    <>
      <PageIntro eyebrow="Admin · Products" title={`Edit ${item.product.brand} ${item.product.name}`} />
      <div className="page-container">
        <ProductForm
          originalSlug={item.product.slug}
          defaultValues={fromProduct(item.product)}
          categories={categories}
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
