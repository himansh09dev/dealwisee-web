import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MongoMemoryServer } from "mongodb-memory-server";

/*
 * Local MongoDB without Docker or a system install: runs a real mongod
 * binary (downloaded once by mongodb-memory-server) with data persisted in
 * api/.data/db, on port 27017. Ctrl+C to stop. Use a local install or a
 * MongoDB Atlas URI instead by setting MONGODB_URI and skipping this.
 */
const dbPath = fileURLToPath(new URL("../.data/db", import.meta.url));
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});
console.log(`MongoDB running at ${server.getUri()} (data: api/.data/db). Press Ctrl+C to stop.`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    // doCleanup: false keeps the data directory for next time.
    void server.stop({ doCleanup: false }).then(() => process.exit(0));
  });
}
