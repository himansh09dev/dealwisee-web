# Architecture

## Topology

```
Browser ──► Next.js (web origin) ──rewrite /api/*──► Express API ──► MongoDB
               │                                       ▲
               └── Server Components / Server Actions ─┘  (API_INTERNAL_URL, server-only)
```

- The browser only talks to the web origin. `next.config.ts` rewrites `/api/*` to Express.
  - The API's session cookie is first-party, so CORS isn't involved for normal use.
  - No backend URL or secret is exposed: there are no `NEXT_PUBLIC_` variables.
- Server code calls the API directly through `lib/api/server.ts`, which is marked `server-only`.
  - For calls made on a user's behalf (admin actions, the session check), it forwards the session cookie.
- `packages/contracts` holds the Zod schemas both sides use. The API validates input with them. The web app validates forms and parses every API response with them, so a contract change fails loudly rather than rendering `undefined`.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Session strategy | Opaque random token in an HttpOnly cookie. Its SHA-256 hash is stored in a `sessions` collection with a TTL index. | Revocable immediately (sign-out, password change), unlike a stateless JWT. Nothing readable by JavaScript. A DB leak doesn't expose live tokens. One indexed lookup per authenticated request is cheap. |
| Password hashing | `scrypt` from `node:crypto`, cost 2^17, r = 8, parameters stored in the hash | Memory-hard and on the OWASP list, with no native dependency to build. The cost can be raised later and old hashes still verify. |
| CSRF | SameSite=Lax, plus an Origin/Sec-Fetch-Site check on unsafe methods, plus JSON-only bodies | Defence in depth without token plumbing. Works because the browser goes through one origin. |
| API runtime | Node ≥ 24 native TypeScript (type stripping); `tsc` only for typechecking | No build step or transpiler in dev or production. Code is limited to "erasable" TypeScript syntax. |
| Local database | `mongodb-memory-server` runs a real `mongod` for tests (throwaway) and for `npm run db` (persisted in `api/.data`) | No Docker or system install needed. `MONGODB_URI` can point at Atlas or a local install instead. |
| Search | MongoDB `$text` index, with every term required | Indexed and simple. It doesn't match partial words; Atlas Search is the upgrade path. |
| Listing facets | One `$facet` aggregation. Each facet ignores its own dimension. | One round trip for items, total and counts. |

## Rendering and caching (Next.js Cache Components)

- **Catalog reads** (`lib/catalog/index.ts`) are `'use cache'` functions:
  - `cacheLife('minutes')`, tagged `catalog`.
  - Admin server actions call `updateTag('catalog')` after a successful mutation, so the next request shows the change (read-your-own-writes).
- Pages call those reads **at request time**, after `connection()` or `searchParams`/`params` inside `<Suspense>`.
  - `next build` therefore never needs the API running. The static shell (header, intros, skeletons) is prerendered; data streams in.
  - Trade-off: the homepage isn't fully static. It's served from the data cache after the first request.
- The default cache is in-memory per server instance. Multiple instances would need a shared cache handler.

## State: three kinds, kept separate

| Kind | Lives in | Examples |
| --- | --- | --- |
| URL state | `searchParams`, parsed by `lib/catalog/query.ts` | Listing search, filters, sort and page; admin search |
| Server state | Server Components (catalog). TanStack Query in the browser (session, wishlist, comparison products, picker search). | Product pages; `useSession`, `useWishlist` |
| Local UI state | Component state. The comparison selection uses a small localStorage list (it's a preference, not account data). | Picker open, "only differences", password visibility |

TanStack Query details:
- Fetches pass `signal`, so superseded requests are cancelled.
- The picker and the comparison use `keepPreviousData` to avoid flicker.
- The wishlist toggle is optimistic, with rollback on error, and invalidates the wishlist query when it settles.
- A **401 from any request** clears the cached user and resets personal data. When it interrupts something the user did, a toast offers to sign in again (session expiry or revocation).

## Listing behaviour

- Controls write the URL with `router.replace` inside a transition. The current results stay visible (dimmed, `aria-busy`) while the next set renders. Pagination uses real links, so Back works.
- **Debounce for search** (350 ms), not throttle: only the settled query matters. Throttle suits continuous signals like scroll, resize or drag. The compare picker debounces its search for the same reason.
- **The price range is applied explicitly** (Apply or Enter), so half-typed numbers don't flash wrong results.
- **Pagination rather than infinite scroll:** every page has a URL, the footer stays reachable, and there are no observer races.

## Authorization

- The **API** enforces it on every request:
  - `requireAuth` on the wishlist routes;
  - `requireRole("admin")` on every `/api/admin/*` route.
- The admin layout's redirect and its "no access" page are UX only. Bypassing them changes nothing, because the API returns 401 or 403.
- Integration tests cover anonymous, user and admin access to each admin endpoint.

## Known limitations

- Rate limiting uses an in-memory store (per instance). Multiple instances need Redis or similar.
- Product images are entered as URLs; uploads need object storage (S3, planned).
- Price history comes from the seed data. Recording real price history needs a scheduled ingestion job (planned).
- There's no email verification or password reset yet.
