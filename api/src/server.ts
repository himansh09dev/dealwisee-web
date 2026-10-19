import { createApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { connectDatabase, disconnectDatabase } from "./db/connect.ts";
import { createLogger } from "./lib/logger.ts";

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);

await connectDatabase(env.MONGODB_URI);
const server = createApp(env, logger).listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "API listening");
});

// Finish in-flight requests, then close the DB, on deploy/restart signals.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    logger.info({ signal }, "shutting down");
    server.close(() => {
      void disconnectDatabase().then(() => process.exit(0));
    });
  });
}
