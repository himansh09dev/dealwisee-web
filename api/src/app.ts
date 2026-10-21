import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";

import type { Env } from "./config/env.ts";
import { authenticate } from "./middleware/auth.ts";
import { originCheck, requireJson } from "./middleware/csrf.ts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.ts";
import { apiRouter } from "./routes/index.ts";

/** "1" → 1 hop, "true"/"false" → boolean, anything else (e.g. "loopback", a CIDR list) as-is. */
function parseTrustProxy(value: string): boolean | number | string {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "true" || value === "false") return value === "true";
  return value;
}

/** Builds the Express app without listening, so tests can drive it with supertest. */
export function createApp(env: Env, logger: Logger) {
  const app = express();
  const production = env.NODE_ENV === "production";

  app.disable("x-powered-by");
  app.set("trust proxy", parseTrustProxy(env.TRUST_PROXY));
  app.set("query parser", "simple");

  // Access logs: method, URL, status and timing only — no headers, cookies or bodies.
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(helmet());
  // Only the configured frontend may call the API from a browser, with cookies.
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(requireJson);
  app.use(originCheck(env.FRONTEND_ORIGIN));
  app.use(authenticate(production));

  app.use(
    "/api",
    apiRouter({
      production,
      scryptLogN: env.SCRYPT_LOG_N,
      sessionTtlDays: env.SESSION_TTL_DAYS,
      rateLimit: {
        max: env.AUTH_RATE_LIMIT_MAX,
        accountMax: env.AUTH_ACCOUNT_RATE_LIMIT_MAX,
        windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      },
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
