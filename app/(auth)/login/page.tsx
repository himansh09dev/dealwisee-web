import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell, FormSkeleton } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Welcome back"
      lede="Sign in to sync your wishlist and comparisons."
      footer={
        <>
          New to PricePilot?{" "}
          <Link href="/register" className="focus-ring rounded-xs font-medium text-ink underline underline-offset-3">
            Create an account
          </Link>
        </>
      }
    >
      {/* The form reads ?next= (request data), so it renders inside Suspense. */}
      <Suspense fallback={<FormSkeleton />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
