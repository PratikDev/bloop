// Browser tests (Playwright, Apache-2.0; dev only). Run with `npm run test:e2e` or `npm run test:smoke`; browsers install to
// PLAYWRIGHT_BROWSERS_PATH (on this machine D:\Jukebox\tools\ms-playwright: nothing goes on C:).
// Specs are *.e2e.ts so `bun test` (unit tests) never picks them up.
import { defineConfig, devices } from "@playwright/test";

// BLOOP_URL points the checks at a server that is already running (npm run health serves a production build on
// :3100, much faster than the dev server's on-demand compiles); otherwise the dev server, started if needed.
const BASE = process.env.BLOOP_URL ?? "http://localhost:3000";
// Firefox plays sound without a gesture only with these (Chromium: --autoplay-policy below).
const FIREFOX_PREFS = { "media.autoplay.default": 0, "media.autoplay.blocking_policy": 0 };
// Headless Chromium draws WebGL on the CPU (SwiftShader) unless told to use the GPU: the 3D globe then starves the page
// (in-page timers ran ~40x slow) and Playwright's click checks time out on the Turntable. These flags put it on the
// machine's GPU (on Windows through Direct3D 11; check with WEBGL_debug_renderer_info). Firefox already uses the GPU.
const CHROMIUM_GPU = ["--enable-gpu", "--ignore-gpu-blocklist", ...(process.platform === "win32" ? ["--use-angle=d3d11"] : [])];

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  outputDir: "../data_raw/_tmp/playwright",
  use: {
    baseURL: BASE,
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required", ...CHROMIUM_GPU] },
    screenshot: "only-on-failure",
  },
  // Chromium and Firefox on desktop (the app is shown as a desktop website); both run every suite.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], launchOptions: { firefoxUserPrefs: FIREFOX_PREFS } } },
  ],
  webServer: process.env.BLOOP_URL ? undefined : { command: "bun run dev", cwd: "..", url: BASE, reuseExistingServer: true, timeout: 180_000 },
});
