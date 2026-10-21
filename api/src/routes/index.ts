import { Router, type RequestHandler } from "express";

import * as adminProducts from "../controllers/admin-products.controller.ts";
import { authController, type AuthControllerConfig } from "../controllers/auth.controller.ts";
import { health } from "../controllers/health.controller.ts";
import * as products from "../controllers/products.controller.ts";
import * as wishlist from "../controllers/wishlist.controller.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { authRateLimit, loginAccountRateLimit } from "../middleware/rate-limit.ts";

export type RoutesConfig = AuthControllerConfig & {
  rateLimit: { max: number; accountMax: number; windowMs: number };
};

/** Personal or privileged responses must never be cached by browsers or proxies. */
const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

export function apiRouter(config: RoutesConfig) {
  const router = Router();
  const auth = authController(config);
  const limiter = authRateLimit(config.rateLimit);
  const accountLimiter = loginAccountRateLimit({ max: config.rateLimit.accountMax, windowMs: config.rateLimit.windowMs });

  router.get("/health", health);

  // Public catalog. /compare is declared before /:slug so it isn't read as a slug.
  router.get("/products", products.list);
  router.get("/products/compare", products.compare);
  router.get("/products/:slug", products.getBySlug);

  router.use("/auth", noStore);
  router.post("/auth/register", limiter, auth.register);
  router.post("/auth/login", limiter, accountLimiter, auth.login);
  router.post("/auth/logout", auth.logout);
  router.get("/auth/me", auth.me);

  router.use("/wishlist", noStore, requireAuth);
  router.get("/wishlist", wishlist.list);
  router.post("/wishlist/:productId", wishlist.add);
  router.delete("/wishlist/:productId", wishlist.remove);

  // Every admin endpoint: authenticated AND admin role, checked server-side.
  router.use("/admin", noStore, requireRole("admin"));
  router.post("/admin/products", adminProducts.create);
  router.patch("/admin/products/:id", adminProducts.update);
  router.delete("/admin/products/:id", adminProducts.remove);

  return router;
}
