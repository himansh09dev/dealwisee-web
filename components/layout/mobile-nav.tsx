"use client";

import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { LogoMark } from "./logo";
import { categoryLinks, primaryNav } from "./nav-config";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton label="Open menu" icon={<Menu aria-hidden />} className="md:hidden" />
      </DialogTrigger>
      <DialogContent placement="sheet" closeLabel="Close menu" className="overflow-y-auto">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <LogoMark />
          <DialogTitle className="font-sans text-base font-semibold tracking-tight">Menu</DialogTitle>
          <DialogDescription className="sr-only">Site navigation</DialogDescription>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col px-5 py-6">
          <ul className="space-y-1">
            {[...primaryNav, { href: "/wishlist", label: "Wishlist" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="focus-ring flex items-center justify-between rounded-md py-2.5 font-display text-2xl tracking-tight text-ink"
                >
                  {item.label}
                  <ArrowRight aria-hidden className="size-4 text-ink-subtle" />
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-8 text-ink-subtle">Categories</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            {categoryLinks.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={close}
                  className="focus-ring block rounded-xs py-1.5 text-sm text-ink-muted hover:text-ink"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login" onClick={close}>
                Sign in
              </Link>
            </Button>
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
