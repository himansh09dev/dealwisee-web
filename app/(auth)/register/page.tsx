import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell, FormSkeleton } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Create your account"
      lede="Keep your wishlist and comparisons in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="focus-ring rounded-xs font-medium text-ink underline underline-offset-3">
            Sign in
          </Link>
        </>
      }
    >
      {/* The form reads ?next= (request data), so it renders inside Suspense. */}
      <Suspense fallback={<FormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
