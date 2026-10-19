import { defineConfig } from "vitest/config";

// Unit tests for pure logic (node environment). Component/E2E tests come later.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
