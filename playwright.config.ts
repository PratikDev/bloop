// Browser tests (Playwright, Apache-2.0; dev only). Run with `bun run e2e`; browsers install to
// PLAYWRIGHT_BROWSERS_PATH (on this machine D:\Jukebox\tools\ms-playwright: nothing goes on C:).
// Specs are *.e2e.ts so `bun test` (unit tests) never picks them up.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  outputDir: "data_raw/_tmp/playwright",
  use: {
    baseURL: "http://localhost:3000",
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "bun run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 180_000 },
});
