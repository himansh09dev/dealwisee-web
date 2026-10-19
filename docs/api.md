# PricePilot API

Express 5 + MongoDB (Mongoose). Base path `/api`. Request and response shapes are defined once, as Zod schemas, in [`packages/contracts`](../packages/contracts/src). The API validates with them, and the web app parses responses with them.

## Conventions

**Envelope:** every response is JSON.

```jsonc
// success
{ "data": <payload>, "meta": { ... } }          // meta only where noted
// failure
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid",
             "details": [{ "path": "email", "message": "Enter a valid email address" }] } }
```

| Status | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Body, query or path parameter failed validation (`details` lists the fields) |
| 400 | `MALFORMED_REQUEST` | Malformed JSON, or an id that isn't an ObjectId |
| 401 | `UNAUTHENTICATED` | No valid session, or wrong email/password |
| 403 | `FORBIDDEN` | Signed in without the required role, or a cross-site state-changing request |
| 404 | `NOT_FOUND` | Unknown resource or route |
| 409 | `CONFLICT` | Duplicate slug or email |
| 413 | `PAYLOAD_TOO_LARGE` | Body over 100 KB |
| 415 | `MALFORMED_REQUEST` | Body isn't `application/json` |
| 429 | `RATE_LIMITED` | Too many login or registration attempts |
| 503 | `SERVICE_UNAVAILABLE` | Database unreachable |
| 500 | `INTERNAL_ERROR` | Anything else. Details are logged, never returned |

**Money** is in integer **cents**. **Ids** are 24-character hex ObjectIds.

**Auth:** the session is an opaque token in the `pp_session` cookie:
- HttpOnly, SameSite=Lax, and Secure in production; 7-day expiry.
- The server stores only its SHA-256 hash, and a TTL index removes expired sessions.

**CSRF:** for POST, PATCH and DELETE, requests are rejected when `Origin` isn't in `FRONTEND_ORIGIN` or `Sec-Fetch-Site` is `cross-site`. Bodies must be JSON. Together with SameSite=Lax, this stops cross-site forms from acting with a user's cookie.

**CORS:** only `FRONTEND_ORIGIN`, with credentials. In the default setup the browser goes through the Next.js proxy (same origin), so CORS only matters for direct browser calls.

**Caching:** auth, wishlist and admin responses are sent with `Cache-Control: no-store`.

## Endpoints

### `GET /api/health`
Returns `200 { data: { status: "ok", db: "up", uptimeSeconds } }`, or `503` with `db: "down"`.

### `GET /api/products`

Lists products with search, filters, sorting and bounded pagination.

| Query | Type | Default | Notes |
| --- | --- | --- | --- |
| `q` | string ≤ 100 | — | Full-text search (name, brand, summary, description, spec values). **Every** term must match; stemming applies; no partial words. |
| `category` | id, repeated or comma-separated | — | `audio`, `phones`, `computing`, `gaming`, `cameras`, `wearables`, `footwear`, `home`, `accessories` |
| `brand` | string, repeated or comma-separated | — | Exact brand name |
| `minPrice`, `maxPrice` | cents | — | Filter on `currentPrice`; `minPrice ≤ maxPrice` |
| `sort` | `newest` \| `price-asc` \| `price-desc` \| `name-asc` \| `drops` | `newest` | `drops` ranks by the current price against the recent average. Products without history sort last. |
| `page` | 1–1000 | 1 | A page past the end returns the last page |
| `pageSize` | 1–48 | 12 | |

The response is `200 { data: Product[], meta }`:
- `meta` is `{ page, pageSize, total, pageCount, facets }`.
- `facets` is `{ categories: Facet[], brands: Facet[] }`, where `Facet = { value, label, count }`.
- Facet counts ignore their own dimension. For example, with `category=audio`, the `phones` count is how many phones match the other filters.

Invalid parameters return 400.

### `GET /api/products/compare?slugs=a,b,c`
Takes 1–4 slugs. Returns `200 { data: Product[], meta: { missing: string[] } }`. Products come back in the requested order; unknown slugs are listed in `missing`.

### `GET /api/products/:slug`
Returns `200 { data: Product }`, `404` if the product doesn't exist, or `400` for an invalid slug.

**Product:**

```ts
{
  id, slug, name, brand, category, summary, description,
  image: { url, alt, sourceUrl? },
  listPrice?,                       // manufacturer price, when known
  offers: [{ storeId, storeName, price, shipping, inStock }],
  specs: [{ label, value }],
  currentPrice,                     // lowest in-stock price + shipping (derived)
  previousPrice?,                   // last recorded weekly low (only with history)
  history?: number[],               // weekly lows, oldest first; absent when unknown
  createdAt, updatedAt              // ISO 8601
}
```

### `POST /api/auth/register`
- Body: `{ name, email, password }`. The password needs 10–128 characters with a letter and a number.
- The email is trimmed and lowercased. Any `role` in the body is ignored: new accounts are always `user`.
- Returns `201 { data: { user } }` and sets the session cookie. A duplicate email returns `409`.
- Rate limited.

### `POST /api/auth/login`
- Body: `{ email, password }`.
- Returns `200 { data: { user } }` and sets the session cookie.
- A wrong password and an unknown email both return the same `401` with the same timing.
- Rate limited.

### `POST /api/auth/logout`
Deletes the session and clears the cookie. Returns `200 { data: { signedOut: true } }`.

### `GET /api/auth/me`
Returns `200 { data: { user: { id, name, email, role } | null } }`. Being anonymous is a normal state here, not an error.

### Wishlist (requires a session; `401` otherwise)

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/wishlist` | `200 { data: Product[] }`, newest first |
| POST | `/api/wishlist/:productId` | `201` if added, `200` if already saved (idempotent); `404` for an unknown product |
| DELETE | `/api/wishlist/:productId` | `200 { data: { productId, saved: false } }` (idempotent) |

A compound unique index on `(userId, productId)` prevents duplicate entries even under concurrent requests.

### Admin (requires a session **and** `role: "admin"`: `401` without a session, `403` without the role)

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| POST | `/api/admin/products` | full product input | `201 { data: Product }`; `409` for a duplicate slug |
| PATCH | `/api/admin/products/:id` | any subset of the input (not empty) | `200 { data: Product }` |
| DELETE | `/api/admin/products/:id` | — | `200 { data: { id, deleted: true } }`; also removes the product's wishlist entries |

**Product input:**
- Fields: `slug`, `name`, `brand`, `category`, `summary`, `description`, `image { url (https:// or /images/…), alt }`, optional `listPrice`, `offers[]` (1–20, unique `storeId`) and `specs[]`.
- `currentPrice` and `previousPrice` are always derived by the server. Price history can't be written through the API.
- PATCH validates the merged product as a whole, so a partial update can't leave it inconsistent.

## Example

```bash
curl -s "http://localhost:4000/api/products?q=headphones&sort=price-asc&pageSize=2"
```
