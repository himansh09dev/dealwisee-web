"use client";

import { ChevronDown, Heart, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { useSession, useSignOut } from "@/lib/auth/use-session";

/** Header account control. Session state comes from the API via TanStack Query. */
export function UserMenu() {
  const pathname = usePathname();
  const { data: user, isPending } = useSession();
  const signOut = useSignOut();

  if (isPending) return <Skeleton className="hidden h-8 w-20 md:block" />;

  if (!user) {
    // "from", not "next": returning here is a convenience, so admins may land on the dashboard instead.
    const from = ["/", "/login", "/register"].includes(pathname) ? "" : `?from=${encodeURIComponent(pathname)}`;
    return (
      <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex">
        <Link href={`/login${from}`}>Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden md:inline-flex">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-full bg-ink text-2xs font-semibold text-ink-inverse"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-28 truncate">{user.name}</span>
          <ChevronDown aria-hidden className="size-3.5!" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block font-sans text-sm text-ink">{user.name}</span>
          <span className="block truncate font-sans text-xs text-ink-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/wishlist">
            <Heart aria-hidden />
            Wishlist
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/products">
              <Settings2 aria-hidden />
              Manage products
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            signOut.mutate(undefined, {
              onSuccess: () => toast("Signed out"),
              onError: () => toast("Signed out on this device"),
            })
          }
        >
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
