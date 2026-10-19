# PricePilot

Compare total prices across stores, see how today's price compares with recent history, and keep a wishlist.

A portfolio project: a Next.js App Router frontend, an Express + MongoDB REST API, and a shared contracts package, in one npm workspace.

```
.                      Next.js 16 web app (App Router, React 19, Tailwind 4)
├── api/               Express 5 + Mongoose REST API (Node ≥ 24, runs TypeScript natively)
└── packages/contracts Zod schemas + types shared by web and API
```

Further reading:
- [docs/api.md](docs/api.md): endpoint reference.
- [docs/frontend-architecture.md](docs/frontend-architecture.md): data flow, caching, state and security notes.
- [docs/design-system.md](docs/design-system.md): visual direction and tokens.

## Local setup

**Requirements:** Node.js 24 or newer (`.nvmrc`) and npm 11. You don't need Docker or a MongoDB install; see step 2.

1. **Install:**

   ```bash
   npm install
   ```

2. **Database.** Pick one option.
   - **Bundled (default):** start a local MongoDB in its own terminal. The first run downloads the official `mongod` binary (about 80 MB) to `~/.cache/mongodb-binaries`. Data is kept in `api/.data/db`.

     ```bash
     npm run db
     ```

   - **Your own:** a local MongoDB install, or a MongoDB Atlas cluster (the free M0 tier works). Put its URI in `MONGODB_URI` in step 3.

3. **Configure:**

   ```bash
   cp api/.env.example api/.env
   cp .env.example .env.local
   ```

   In `api/.env`, choose your own `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD`: 10+ characters with a letter and a number. These are local test accounts. Never reuse a real password.

4. **Seed** the catalog and the two accounts. This resets products and wishlists, and refuses to run with `NODE_ENV=production`.

   ```bash
   npm run seed
   ```

5. **Run** the API and the web app, each in its own terminal:

   ```bash
   npm run dev:api
   ```

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. Sign in with the admin account from `api/.env` to reach **Manage products** in the account menu.

## Checks

```bash
npm run check
```

This runs:
- web: lint, typecheck and unit tests;
- contracts: typecheck;
- API: typecheck and integration tests against a throwaway in-memory MongoDB.

## How the pieces talk

The browser only ever calls the web origin. Next.js rewrites `/api/*` to the Express API (`API_INTERNAL_URL`, server-only). Server Components call the API directly with the same variable. The session is an HttpOnly cookie set by the API.

There are no `NEXT_PUBLIC_*` variables, so no backend configuration reaches the browser.

## Data

The seed catalog uses real products and Unsplash photography. **Stores are fictional, and every price and price-history point is sample data.**
