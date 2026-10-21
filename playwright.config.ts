import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests against a production build and a throwaway API:
 *   - API: api/scripts/test-stack.ts on :4100 (in-memory MongoDB, deterministic data)
 *   - Web: `next build` into .next-e2e, served by `next start` on :3100
 * Nothing touches your dev servers (3000/4000) or your database.
 */

const WEB = "http://localhost:3100";
const API = "http://localhost:4100";
const webEnv = { API_INTERNAL_URL: API, NEXT_DIST_DIR: ".next-e2e", SITE_URL: WEB };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false, // tests share one database; keep order deterministic
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: WEB,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "e2e", use: { ...devices["Desktop Chrome"] }, grepInvert: /@perf|@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
    { name: "perf", use: { ...devices["Desktop Chrome"] }, grep: /@perf/ },
  ],
  webServer: [
    {
      command: `npm run test-stack -w @pricepilot/api -- --port 4100 --origin ${WEB} --synthetic ${process.env.PERF_SYNTHETIC ?? 0}`,
      url: `${API}/api/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
    },
    {
      command: "npx next build && npx next start -p 3100",
      url: WEB,
      env: webEnv,
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
