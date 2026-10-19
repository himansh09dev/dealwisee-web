"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { categoryLinks, primaryNav } from "./nav-config";

const navItem =
  "focus-ring relative inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-3 text-sm font-medium text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink data-[active=true]:text-ink";

export function DesktopNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Primary" className="hidden items-center md:flex">
      <Link
        href={primaryNav[0].href}
        className={navItem}
        data-active={isActive(primaryNav[0].href)}
        aria-current={isActive(primaryNav[0].href) ? "page" : undefined}
      >
        {primaryNav[0].label}
      </Link>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className={cn(navItem, "data-[state=open]:text-ink")}>
          Categories
          <ChevronDown
            aria-hidden
            className="size-3.5 transition-transform duration-(--duration-base) in-data-[state=open]:rotate-180"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Browse by category</DropdownMenuLabel>
          {categoryLinks.map((c) => (
            <DropdownMenuItem key={c.href} asChild>
              <Link href={c.href}>{c.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/products">All products</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {primaryNav.slice(1).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={navItem}
          data-active={isActive(item.href)}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
