import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // One real mongod for the whole run; each test file uses its own database.
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 120_000,
  },
});
