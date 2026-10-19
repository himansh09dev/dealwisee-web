import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <PageIntro eyebrow="Account" title="Sign in" />
      <div className="page-container">
        <EmptyState
          icon={<KeyRound />}
          title="Accounts aren't available yet"
          description="Sign-in and registration ship with the API and authentication phase. Until then, your wishlist is saved on this device."
          action={
            <Button asChild variant="secondary">
              <Link href="/wishlist">View your wishlist</Link>
            </Button>
          }
        />
      </div>
    </>
  );
}
