// Browser tests (Playwright, Apache-2.0; dev only). Run with `bun run e2e`; browsers install to
// PLAYWRIGHT_BROWSERS_PATH (on this machine D:\Jukebox\tools\ms-playwright: nothing goes on C:).
// Specs are *.e2e.ts so `bun test` (unit tests) never picks them up.
import { defineConfig, devices } from "@playwright/test";

// BLOOP_URL points the checks at a server that is already running (npm run health serves a production build on
// :3100, much faster than the dev server's on-demand compiles); otherwise the dev server, started if needed.
const BASE = process.env.BLOOP_URL ?? "http://localhost:3000";

// bloop-dev's feature suites, written for its own layout: each joins the run once its feature works in this design
// and its selectors follow (docs/superpowers/plans/2026-11-11-bloop-dev-integration.md).
const PENDING = ["**/e2e/a11y/**", "**/e2e/art/**", "**/e2e/cv/**", "**/e2e/data/**", "**/e2e/integration/**", "**/e2e/mentor/**", "**/e2e/ask-bloop.e2e.ts"];

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  testIgnore: PENDING,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  outputDir: "data_raw/_tmp/playwright",
  use: {
    baseURL: BASE,
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Firefox runs the braille protocol (the screen-reader protocol tests Chrome and Firefox), the record health check and
    // the feature inventory.
    { name: "firefox", use: { ...devices["Desktop Firefox"], launchOptions: { firefoxUserPrefs: { "media.autoplay.default": 0, "media.autoplay.blocking_policy": 0 } } },
      testMatch: ["**/braille-protocol.e2e.ts", "**/health-records.e2e.ts", "**/features.e2e.ts"] },
  ],
  webServer: process.env.BLOOP_URL ? undefined : { command: "bun run dev", url: BASE, reuseExistingServer: true, timeout: 180_000 },
});
