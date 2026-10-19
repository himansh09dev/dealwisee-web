import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";

import { WishlistGrid } from "./wishlist-grid";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <PageIntro eyebrow="Your list" title="Wishlist">
        Saved on this device for now. Once accounts launch, your list will follow you across devices.
      </PageIntro>
      <div className="page-container">
        <WishlistGrid />
      </div>
    </>
  );
}
