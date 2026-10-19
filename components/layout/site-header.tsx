import { Suspense } from "react";

import { DesktopNav } from "./desktop-nav";
import { HeaderSearch, MobileSearch } from "./header-search";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { WishlistLink } from "./wishlist-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/72">
      <div className="page-container flex h-16 items-center gap-2 md:gap-6">
        <Logo className="mr-auto md:mr-0" />
        {/* usePathname can suspend on dynamic routes; the fallback keeps layout stable. */}
        <Suspense fallback={<div className="hidden md:block md:w-64" />}>
          <DesktopNav />
        </Suspense>
        <div className="flex items-center gap-1 md:ml-auto md:flex-1 md:justify-end md:gap-2">
          <HeaderSearch />
          <MobileSearch />
          <WishlistLink />
          {/* usePathname can suspend on dynamic routes. */}
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
