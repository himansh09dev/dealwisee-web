import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { getCatalog } from "@/lib/catalog/queries";

import { WishlistGrid } from "./wishlist-grid";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <PageIntro eyebrow="Your list" title="Wishlist">
        Saved on this device. Accounts will sync it across devices later.
      </PageIntro>
      <div className="page-container">
        <WishlistGrid catalog={getCatalog()} />
      </div>
    </>
  );
}
