# Frontend architecture (Phase 2)

## Data boundary

```
pages / route handlers / server actions
        │  depend only on
        ▼
CatalogRepository (lib/catalog/repository.ts)
        │  implemented today by
        ▼
seedRepository (lib/catalog/seed-repository.ts)  ← MOCK, in-memory
```

- `lib/catalog/index.ts` exports `catalog`, the only place that chooses an implementation. The Express API phase adds an HTTP adapter and changes that one line.
- `lib/catalog/schema.ts` (Zod) is the contract. Types are inferred from it, the admin form validates with it, and browser fetches parse `/api/products` responses with it.
- The seed adapter's **write methods intentionally don't persist**. They return `READ_ONLY`, so the admin UI tells you that nothing was saved.
- Price claims come only from data. `history` and `listPrice` are optional, and the UI hides the trend, the "vs average" badge and the list price when they're absent.

## State: three kinds, kept separate

| Kind | Where it lives | Examples |
| --- | --- | --- |
| URL state | `searchParams`, parsed by `parseProductQuery` | listing search, filters, sort, page; admin search |
| Server state | Server Components (default); TanStack Query only for browser-held lists | product pages; wishlist and compare product data |
| Local UI state | component `useState` | picker open, "only differences" toggle, password visibility |

The wishlist and compare **selections** use a temporary device-local adapter (`lib/stores/local-list.ts`, localStorage plus `useSyncExternalStore`). They are not authenticated and not authoritative. The API phase swaps them for server-backed lists behind the same hooks.

## Listing behaviour

- **URL is the source of truth.** Controls call `router.replace` inside a transition: current results stay visible (dimmed, `aria-busy`) while the server renders the next set.
  - `replace`, not `push`: ticking boxes and typing shouldn't flood history.
  - Pagination uses real `<Link>`s, so Back steps between pages.
- **Debounce for search (350 ms), not throttle.** Only the settled query matters. Throttling suits continuous signals that need periodic updates (scroll, resize, drag), and none drive this page. Enter submits immediately. The compare picker's search is debounced for the same reason.
- **The price range is applied explicitly** (Apply or Enter). Debouncing half-typed numbers would flash wrong results.
- **Pagination, not infinite scroll.** Every page has a shareable URL, Back restores it, keyboard and screen-reader users can reach the footer, and there are no observers or duplicate-request races to manage.
- **Facet counts ignore their own dimension**, and zero-count options stay visible but disabled, so the panel doesn't reshuffle.

## Rendering with Cache Components

- Request-time data (`searchParams`, `params`) is read inside `<Suspense>`, so each route has a static shell for Partial Prefetching.
- The admin product form renders per request: `useFieldArray` creates ids at render time, which can't be prerendered.
- Client components are limited to interactive leaves: filters, search, sort, compare, wishlist, forms, dialogs.

## Security notes (current state)

- Authentication is **not implemented**. `lib/auth/service.ts` returns "unavailable", and nothing creates sessions or stores credentials.
- Admin access control is **not enforced**. The admin layout and actions mark the seam where the API phase adds role checks. Hiding links is not security.
- Server actions re-validate all input with the same Zod schemas the forms use.
- Image URLs entered in admin must be `https://` or a local `/images/` path.
