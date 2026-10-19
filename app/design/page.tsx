import { Inbox, Plus, RotateCcw, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { PageIntro } from "@/components/layout/page-intro";
import { Price, PriceDelta } from "@/components/product/price";
import { PriceHistoryChart } from "@/components/product/price-history-chart";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { SearchField } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listProducts } from "@/lib/catalog";
import { categoryList, priceSeries } from "@/lib/catalog/schema";
import { defaultQuery } from "@/lib/catalog/query";

import { DemoButton, DialogDemo, IconButtonDemo, FilterDemo, FormDemo, ToastDemo } from "./demos";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

const colors = [
  ["paper", "Page background"],
  ["surface", "Cards, inputs, popovers"],
  ["sunken", "Image wells, skeletons"],
  ["ink", "Primary text, primary buttons"],
  ["ink-muted", "Secondary text"],
  ["ink-subtle", "Meta text (≥4.5:1)"],
  ["line", "Hairlines"],
  ["line-strong", "Dividers, outlines"],
  ["line-control", "Input borders (≥3:1)"],
  ["signal", "Savings, best price, focus"],
  ["signal-soft", "Savings badge ground"],
  ["rise", "Price went up"],
  ["danger", "Errors"],
] as const;

const typeScale = [
  ["5xl", "text-5xl font-display tracking-tightest"],
  ["4xl", "text-4xl font-display tracking-tight"],
  ["3xl", "text-3xl font-display tracking-tight"],
  ["2xl", "text-2xl font-display"],
  ["xl", "text-xl font-medium"],
  ["lg", "text-lg"],
  ["base", "text-base"],
  ["sm", "text-sm"],
  ["xs", "text-xs"],
] as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10" aria-label={title}>
      <h2 className="eyebrow text-ink-subtle">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <>
      <PageIntro eyebrow="Internal" title="Design system">
        Tokens and components used across PricePilot. Every control on this page is live. Rationale
        lives in <code className="font-mono text-base">docs/design-system.md</code>.
      </PageIntro>
      <Suspense
        fallback={
          <div className="page-container">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        }
      >
        <DesignContent />
      </Suspense>
    </>
  );
}

async function DesignContent() {
  // Sample products come from the API at request time.
  await connection();
  const { items } = await listProducts({ ...defaultQuery, pageSize: 48 });
  const sample = items.slice(0, 3);
  const first = items[0];
  const firstSeries = first ? priceSeries(first.product) : null;

  return (
    <>

      <div className="page-container">
        <Block title="Color tokens">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {colors.map(([token, use]) => (
              <li key={token}>
                <div
                  className="h-16 rounded-lg border border-line"
                  style={{ background: `var(--${token})` }}
                />
                <p className="mt-2 font-mono text-xs text-ink">{token}</p>
                <p className="text-xs text-ink-muted">{use}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Typography — Newsreader display, Geist UI, Geist Mono meta">
          <ul className="space-y-4">
            {typeScale.map(([name, cls]) => (
              <li key={name} className="flex items-baseline gap-6">
                <span className="w-12 shrink-0 font-mono text-xs text-ink-subtle">{name}</span>
                <span className={`${cls} truncate text-ink`}>Pay the right price</span>
              </li>
            ))}
            <li className="flex items-baseline gap-6">
              <span className="w-12 shrink-0 font-mono text-xs text-ink-subtle">eyebrow</span>
              <span className="eyebrow text-ink-muted">02 — Price watch</span>
            </li>
          </ul>
        </Block>

        <Block title="Radii & elevation">
          <div className="flex flex-wrap gap-6">
            {(["rounded-xs", "rounded-md", "rounded-lg", "rounded-xl"] as const).map((r) => (
              <div key={r} className={`grid size-24 place-items-center border border-line-strong bg-surface ${r}`}>
                <span className="font-mono text-2xs text-ink-muted">{r}</span>
              </div>
            ))}
            {(["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg"] as const).map((s) => (
              <div key={s} className={`grid size-24 place-items-center rounded-lg bg-surface ${s}`}>
                <span className="font-mono text-2xs text-ink-muted">{s}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <DemoButton>Primary</DemoButton>
            <DemoButton variant="secondary">Secondary</DemoButton>
            <DemoButton variant="ghost">Ghost</DemoButton>
            <DemoButton variant="link">Link style</DemoButton>
            <DemoButton disabled>Disabled</DemoButton>
            <DemoButton size="sm" variant="secondary">
              <Plus aria-hidden />
              Small
            </DemoButton>
            <DemoButton size="lg">Large</DemoButton>
            <IconButtonDemo />
          </div>
        </Block>

        <Block title="Badges & price indicators">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Neutral</Badge>
            <Badge tone="outline">Outline</Badge>
            <Badge tone="signal">Best total</Badge>
            <Badge tone="rise">Price up</Badge>
            <Badge tone="danger">Error</Badge>
            <Badge tone="ink">New</Badge>
            <PriceDelta ratio={-0.14} />
            <PriceDelta ratio={0.06} />
            <PriceDelta ratio={0.002} />
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-8">
            <Price amount={24800} compareAt={34999} size="xl" />
            <Price amount={8999} compareAt={9999} size="lg" />
            <Price amount={4599} />
            {firstSeries && <PriceHistoryChart series={firstSeries} variant="spark" className="w-32" />}
          </div>
        </Block>

        <Block title="Inputs & forms">
          <div className="grid gap-10 md:grid-cols-2">
            <form role="search" action="/products" className="max-w-md">
              <SearchField id="design-search" name="q" label="Search products" placeholder="Search products, brands…" size="lg" />
            </form>
            <FormDemo />
          </div>
        </Block>

        <Block title="Filters, sort & tabs">
          <Tabs defaultValue="drops" className="mb-6">
            <TabsList aria-label="Sort (demo)">
              <TabsTrigger value="drops">Biggest drops</TabsTrigger>
              <TabsTrigger value="price">Lowest price</TabsTrigger>
              <TabsTrigger value="newest">Newest</TabsTrigger>
            </TabsList>
          </Tabs>
          <FilterDemo
            categories={categoryList}
            items={items.map(({ product, insight }) => ({
              category: product.category,
              total: insight.best.total,
            }))}
          />
        </Block>

        <Block title="Overlays & feedback">
          <div className="flex flex-wrap gap-3">
            <DialogDemo />
            <ToastDemo />
          </div>
        </Block>

        <Block title="Product cards">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
            {sample.map((item) => (
              <li key={item.product.slug} className="flex">
                <ProductCard {...item} className="w-full" />
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Loading, empty & error states">
          <div className="grid gap-6 lg:grid-cols-3">
            <div aria-label="Loading example" className="rounded-xl border border-line p-5">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="mt-4 h-3 w-1/3" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-5 h-5 w-1/2" />
            </div>
            <EmptyState
              as="h3"
              icon={<Inbox />}
              title="No matches"
              description="Try removing a filter or searching for a brand instead."
              action={<DemoButton variant="secondary" size="sm">Clear filters</DemoButton>}
            />
            <ErrorState
              as="h3"
              icon={<TriangleAlert />}
              title="Prices didn't load"
              description="Error state used when a fetch fails."
              action={
                <DemoButton size="sm">
                  <RotateCcw aria-hidden />
                  Retry
                </DemoButton>
              }
            />
          </div>
        </Block>
      </div>
    </>
  );
}
