import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · PricePilot" },
  robots: { index: false, follow: false },
};

/*
 * Protected-route seam. ACCESS CONTROL IS NOT ENFORCED YET: in the API phase
 * this layout will read the session and call forbidden()/redirect() for
 * non-admins, and every admin action/API route re-checks the role. Hiding
 * links is not security, so the banner says so plainly.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="pb-10">
      <div className="border-b border-rise/30 bg-rise-soft">
        <p className="page-container flex items-center gap-2 py-2.5 text-sm text-rise">
          <ShieldAlert aria-hidden className="size-4 shrink-0" />
          Admin preview: access control isn&rsquo;t enforced yet, and changes aren&rsquo;t saved until the API is
          connected.
        </p>
      </div>
      {children}
    </div>
  );
}
