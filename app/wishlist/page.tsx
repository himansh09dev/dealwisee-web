import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";

import { WishlistGrid } from "./wishlist-grid";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <PageIntro eyebrow="Your list" title="Wishlist">
        Products you&rsquo;re keeping an eye on, saved to your account.
      </PageIntro>
      <div className="page-container">
        <WishlistGrid />
      </div>
    </>
  );
}
