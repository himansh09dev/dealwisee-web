# Phase 4: performance, testing, accessibility and security review

Every change below started from a measurement or a failing test. Raw numbers are in [`docs/perf/`](perf/).

## How things were measured

| What | How | Reproduce |
| --- | --- | --- |
| Database queries | 20,013 products (13 seed + 20,000 deterministic synthetic) in a throwaway `mongod`. Each listing scenario runs 25× through the real service. The MongoDB profiler records plan, keys and documents examined, and whether it sorted in memory. | `npm run perf:api` |
| Pages | A production build against a deterministic test API. Chromium at 4× CPU slowdown, cold browser cache, warm server cache, median of 3 loads. "Critical JS" means scripts requested before the `load` event. | `npm run perf:web` |
| Accessibility | axe-core (WCAG 2.0/2.1/2.2 A and AA) on every main page in light and dark, plus keyboard flows in end-to-end tests. | `npm run test:e2e` |

The baseline is the committed Phase 3 code (`6e3c756`), built in a separate git worktree and measured with the same harness.

## Prioritized issues

### Critical correctness and security (all fixed)

| # | Issue | Evidence | Fix | Verified by |
| --- | --- | --- | --- | --- |
| S1 | **Login rate limit could be bypassed, or turned into a global lockout.** The Next.js proxy forwards `X-Forwarded-For` unchanged and doesn't add the client IP. With the header, clients can rotate fake IPs. Without it, every user shares one IP, so 10 failures from anyone block everyone. | Header-echo probe through the proxy | Added a per-account limit (failed sign-ins per email, regardless of IP; successes don't count). The per-IP limit stays. Documented the correct `TRUST_PROXY` for "load balancer → Next.js → API" (`1`), and `TRUST_PROXY` now accepts `true`/`false`. | API tests: rotating `X-Forwarded-For` still gets 429; another account isn't locked out |
| S2 | **Admins could enter an image URL from any HTTPS host.** That URL would make public pages throw (host not configured for `next/image`) and would let the image optimizer fetch arbitrary servers. | Code review | One shared allow-list (`images.unsplash.com` plus local `/images/`), enforced by the API's validation and by `next.config` `remotePatterns`. Path traversal and `http:` are rejected. | API test with 4 hostile URLs → 400 |
| C1 | **The admin table silently showed only the first 48 products.** | Code review | Pagination on the admin table | Typecheck; renders page links |
| C2 | **Removing an item on the wishlist page showed no "Undo".** The card unmounts before the request finishes, and TanStack skips per-call callbacks after unmount. This was a Phase 3 regression. | E2E test failure | Confirm immediately (the UI is already optimistic); error handling moved into the mutation's own options | E2E: remove → Undo → item back |
| C3 | **Clicking a heart before the wishlist loaded couldn't roll back on failure.** | Component test | Hearts act only once the wishlist state is known | Component tests |
| S3 | **The web app sent no security headers.** | Code review | `X-Frame-Options: DENY` with `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS | Headers in `next.config.ts` |
| S4 | **Unbounded wishlist.** `GET /api/wishlist` returned every entry. | Code review | Capped at 200 per user (409 when full; re-adding a saved item is still fine) | API test |

### High-impact performance

**P1. Every listing request scanned the whole collection.** At 20,013 products, each request examined every document and sorted in memory, even for a single category with 2,251 matches. `$facet` sub-pipelines can't use indexes.

The fix:
- The page of items now comes from an indexed `find().sort().skip().limit()`, with an `_id` tie-break so pages never repeat or skip items.
- Totals use `countDocuments`, or collection metadata when there's no filter.
- Facet counts are separate aggregations. When unfiltered, they're answered by a covering index without reading documents.
- Sort indexes now match each sort exactly.
- "Biggest drops" uses a stored `dropRank` sort key, so products without history sort last via an index. An idempotent backfill runs at startup.

| Scenario | Before | After | Documents read for the page |
| --- | --- | --- | --- |
| Default (newest) | 14.6 ms, full scan + in-memory sort | **4.4 ms** | 20,013 → 12 |
| Category filter | 16.6 ms | **4.0 ms** | 20,013 → 12 |
| Category + price ↑ | 16.7 ms | **3.7 ms** | 20,013 → 12 |
| Brand + name sort | 16.4 ms | **3.8 ms** | 20,013 → 12 |
| Biggest drops | 20.9 ms | **3.8 ms** | 20,013 → 12 |
| Deep page (40) | 15.5 ms | **3.7 ms** | 20,013 → 12 |
| Price range | 2.3 ms | **1.3 ms** | 1,563 → 12 |
| Text search | 13.0 ms | 11.6 ms | `$text` index scan; inherent |

These numbers are from a fast local machine with an in-memory server. The scaling matters more than the milliseconds: reads no longer grow with catalog size.

**P2. The Zod validation library loaded on every page's critical path.** The header's session and wishlist hooks validated responses with Zod, and the nav imported constants from the same module as the schemas.

The fix:
- The contracts package now has Zod-free entry points (`taxonomy`, `pricing`, `api-codes`).
- The session check uses a small hand-written parser.
- The wishlist schema loads on demand, only when a signed-in user's wishlist is fetched.
- The listing's URL parser no longer uses Zod.

| Page | Critical JS before → after | Zod in critical JS (after) |
| --- | --- | --- |
| Home | 803 → **694 KB** (−14%) | 0 KB |
| Listing | 838 → **728 KB** | 0 KB |
| Product | 806 → **696 KB** | 0 KB |
| Wishlist | 809 → **700 KB** | 0 KB |
| Sign in / Compare | ≈ unchanged | still used (form and response validation) |

LCP, CLS and TBT stayed within run-to-run noise. They were already good: LCP ≤ 0.5 s, CLS ≤ 0.04, TBT < 70 ms at 4× CPU slowdown.

**P3. Product pages fetched 48 full products to choose 4 "related" ones.** Now a 60–150% price-window query fetches about 9. Product-page image bytes fell from 41 KB to 23 KB as a side effect.

**P4. Every heart on a grid re-rendered when any wishlist item changed.** Each heart now subscribes to its own boolean (TanStack `select` + `notifyOnChangeProps`). A Profiler-based component test proves the other heart doesn't re-render.

**Checked and found fine:** no duplicate API requests on any page (measured); images reserve their space (CLS 0 on server-rendered pages); the LCP image loads eagerly with high priority; catalog reads are cached and tagged; all request sizes are bounded (page size ≤ 48, compare ≤ 4, body ≤ 100 KB, offers ≤ 20, specs ≤ 30).

### Accessibility

| # | Issue | Fix |
| --- | --- | --- |
| A1 | Filter chips' accessible name ran together ("Audio(remove filter)") | Name is now "Remove filter: Audio", which includes the visible text (WCAG 2.5.3) |

**Results:**
- axe-core reports **0 violations** across 8 pages × light and dark, plus the admin dashboard.
- E2E tests cover keyboard flows: skip link moves focus to main; the image viewer opens with Enter, closes with Escape, and returns focus to its trigger; filters, sort, pagination and the comparison picker work by role and label.
- Form errors are linked to their fields (`aria-invalid` and `aria-describedby`), and focus moves to the first error (component tests).
- Reduced motion disables animation (E2E).

### Lower priority (open, by choice)

1. **Zod is still prefetched in the background** (148 KB) because the header's "Sign in" link prefetches the sign-in page. It doesn't block rendering. `prefetch={false}` on that link would save the bytes at the cost of a slower sign-in navigation.
2. **No script Content-Security-Policy on the web app.** A nonce-based CSP makes every page dynamic, which costs the static shells. Revisit with deployment.
3. **Cold-cache homepage makes 18 API calls** (9 are category summaries). They're cached for minutes. A categories endpoint would cut this to 1.
4. **Session lookup takes 2 queries per authenticated request** (session, then user). Could be one `$lookup`.
5. **In-memory rate limits and Next.js data cache are per instance.** Multiple instances need Redis and a shared cache handler.
6. **`$text` search reads every document matching the terms** (≈3,600 at 20k products for "speaker pro"), and doesn't match partial words. Atlas Search is the upgrade path.
7. **Dev-only advisory:** `braces` via `eslint-config-next` (ReDoS in lint tooling). Production dependencies show **0 known vulnerabilities**. `npm audit fix --force` would downgrade to Next 14's lint config, so it was not applied.
8. **Not-found product pages return HTTP 200.** The not-found UI streams inside Suspense. Search engines are told `noindex`, but a real 404 status would be cleaner.

## Tests (actual results of the final run)

| Suite | Tool | Result |
| --- | --- | --- |
| Web unit (URL ↔ query mapping, forms, response parsing, redirects) | Vitest | 26 passed |
| Web components (product card, wishlist button, search debounce, filters, chips, pagination, comparison limits, sign-in and register validation, loading/empty/error states) | Vitest + React Testing Library | 29 passed |
| API (products and validation, pagination limits and stable ordering, auth, sessions, wishlist isolation and duplicates, admin authorization, rate limits, injection, mass assignment, image allow-list, malformed bodies, safe 500 and 503 responses) | Vitest + Supertest + real `mongod` | 63 passed |
| End-to-end (6 journeys + accessibility) | Playwright + axe, production build | 36 passed |
| Lint / typecheck (web, contracts, API) / production build (API unreachable) | | all pass |

Commands:

```bash
npm run check       # lint, typecheck and unit/component/API tests
npm run test:e2e    # builds and starts an isolated stack on :3100 / :4100
npm run perf:web
npm run perf:api
```
