import { ShieldCheck, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { getSessionUser } from "@/lib/auth/session";

// Admin pages are per-user and gated: the layout may render a sign-in redirect
// or an access message instead of its children, so instant-navigation
// validation doesn't apply here.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · PricePilot" },
  robots: { index: false, follow: false },
};

/*
 * Page-level gate for a better experience (redirect to sign-in, explain a
 * missing role). It is NOT the security boundary: every admin API endpoint
 * checks the session and role itself, so bypassing this page achieves nothing.
 */
async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin/products");
  if (user.role !== "admin") {
    return (
      <div className="page-container py-16">
        <ErrorState
          as="h1"
          icon={<ShieldX />}
          title="You don't have access to admin tools"
          description={`Signed in as ${user.email}. Ask an administrator for the admin role.`}
          action={
            <Button asChild variant="secondary">
              <Link href="/">Back to PricePilot</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <>
      <div className="border-b border-line bg-sunken">
        <p className="page-container flex items-center gap-2 py-2.5 text-sm text-ink-muted">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-signal" />
          Admin · signed in as {user.email}. Every change is authorized by the API.
        </p>
      </div>
      {children}
    </>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="pb-10">
      {/* Reads the session cookie (request data), so it renders inside Suspense. */}
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Checking access" className="page-container pt-14">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="mt-10 h-96 w-full" />
          </div>
        }
      >
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}
