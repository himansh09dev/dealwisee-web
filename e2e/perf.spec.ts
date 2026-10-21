import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { test, type Browser } from "@playwright/test";

/*
 * Page-weight and Web Vitals measurement (not a pass/fail test).
 *   PERF_LABEL=baseline npx playwright test --project=perf
 * Per route: warm the server cache once, then 3 cold-browser loads with 4×
 * CPU throttling; report medians. Results → docs/perf/web-<label>.json
 */

const routes: { name: string; path: string; compare?: string[] }[] = [
  { name: "home", path: "/" },
  { name: "listing", path: "/products" },
  { name: "listing (filtered)", path: "/products?category=audio&sort=price-asc" },
  { name: "product", path: "/products/sony-wh-1000xm4" },
  { name: "compare", path: "/compare", compare: ["sony-wh-1000xm4", "jbl-flip-5"] },
  { name: "wishlist (signed out)", path: "/wishlist" },
  { name: "login", path: "/login" },
];

type Sample = {
  /** Scripts requested before the load event: what the page needs to render and hydrate. */
  criticalJsKB: number;
  /** Scripts the page itself loads and runs (<script> elements). */
  pageJsKB: number;
  /** Of pageJsKB, how much is chunks containing the Zod validation library. */
  zodKB: number;
  /** Of criticalJsKB, how much is Zod (needed before the page finishes loading). */
  zodCriticalKB: number;
  /** Everything downloaded, including chunks prefetched for links in view. */
  jsTransferKB: number;
  jsDecodedKB: number;
  jsRequests: number;
  imageTransferKB: number;
  imageRequests: number;
  apiRequests: number;
  duplicateApiRequests: number;
  lcpMs: number;
  cls: number;
  tbtMs: number;
};

const kb = (bytes: number) => Math.round((bytes / 1024) * 10) / 10;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

async function measure(browser: Browser, path: string, compare?: string[]): Promise<Sample> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await context.newPage();
  await page.addInitScript((slugs) => {
    if (slugs) localStorage.setItem("pricepilot:compare:v1", JSON.stringify(slugs));
    const w = window as unknown as { __perf: { lcp: number; cls: number; tbt: number } };
    w.__perf = { lcp: 0, cls: 0, tbt: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) w.__perf.cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.tbt += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  }, compare ?? null);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const js = entries.filter((e) => e.name.endsWith(".js") || e.initiatorType === "script");
    const pageScripts = new Set(
      [...document.querySelectorAll("script[src]")].map((s) => new URL(s.getAttribute("src") ?? "", location.href).href),
    );
    const pageJs = js.filter((e) => pageScripts.has(e.name));
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const loadEnd = nav?.loadEventEnd ?? Infinity;
    const critical = js.filter((e) => e.startTime <= loadEnd);
    const img = entries.filter((e) => e.initiatorType === "img" || e.name.includes("/_next/image"));
    const api = entries.filter((e) => new URL(e.name).pathname.startsWith("/api/"));
    const seen = new Map<string, number>();
    for (const e of api) seen.set(e.name, (seen.get(e.name) ?? 0) + 1);
    const w = window as unknown as { __perf: { lcp: number; cls: number; tbt: number } };
    return {
      pageJsUrls: pageJs.map((e) => e.name),
      criticalJs: critical.reduce((s, e) => s + e.decodedBodySize, 0),
      criticalUrls: critical.map((e) => e.name),
      pageJs: pageJs.reduce((s, e) => s + e.decodedBodySize, 0),
      jsTransfer: js.reduce((s, e) => s + e.transferSize, 0),
      jsDecoded: js.reduce((s, e) => s + e.decodedBodySize, 0),
      jsRequests: js.length,
      imageTransfer: img.reduce((s, e) => s + e.transferSize, 0),
      imageRequests: img.length,
      apiRequests: api.length,
      duplicateApiRequests: [...seen.values()].reduce((s, n) => s + (n - 1), 0),
      ...w.__perf,
    };
  });
  await context.close();
  // Attribute bytes to Zod by reading the built chunk files the page loaded.
  const zodBytesIn = (urls: string[]) =>
    urls.reduce((sum, url) => {
      const file = `.next-e2e/static${new URL(url).pathname.replace(/^\/_next\/static/, "")}`;
      if (!existsSync(file)) return sum;
      const text = readFileSync(file, "utf8");
      return text.includes("ZodError") ? sum + Buffer.byteLength(text) : sum;
    }, 0);
  const zodBytes = zodBytesIn(result.pageJsUrls);
  return {
    criticalJsKB: kb(result.criticalJs),
    pageJsKB: kb(result.pageJs),
    zodKB: kb(zodBytes),
    zodCriticalKB: kb(zodBytesIn(result.criticalUrls)),
    jsTransferKB: kb(result.jsTransfer),
    jsDecodedKB: kb(result.jsDecoded),
    jsRequests: result.jsRequests,
    imageTransferKB: kb(result.imageTransfer),
    imageRequests: result.imageRequests,
    apiRequests: result.apiRequests,
    duplicateApiRequests: result.duplicateApiRequests,
    lcpMs: Math.round(result.lcp),
    cls: Math.round(result.cls * 1000) / 1000,
    tbtMs: Math.round(result.tbt),
  };
}

test("measure page weight and web vitals @perf", async ({ browser }) => {
  test.setTimeout(300_000);
  const label = process.env.PERF_LABEL ?? "run";
  const rows: (Sample & { route: string })[] = [];

  for (const r of routes) {
    // Warm the server's data cache so we measure the page, not the first API round trip.
    const warm = await browser.newPage();
    await warm.goto(r.path, { waitUntil: "networkidle" });
    await warm.close();

    const samples: Sample[] = [];
    for (let i = 0; i < 3; i++) samples.push(await measure(browser, r.path, r.compare));
    const keys = Object.keys(samples[0] ?? {}) as (keyof Sample)[];
    const med = Object.fromEntries(keys.map((k) => [k, median(samples.map((s) => s[k]))])) as Sample;
    rows.push({ route: r.name, ...med });
  }

  mkdirSync("docs/perf", { recursive: true });
  writeFileSync(`docs/perf/web-${label}.json`, JSON.stringify(rows, null, 2));
  console.table(rows);
});
