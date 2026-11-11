import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/** Page file extensions every build accepts (Next's defaults). */
const PAGE_EXTENSIONS = ["tsx", "ts", "jsx", "js"];

/**
 * The audio engine's test page (src/app/dev/audio/page.dev.tsx) is a route only in `next dev`, or in a build made
 * with AUDIO_HARNESS=1 (a test deploy for ear tests on phones). Any other build doesn't accept the "dev.tsx" page
 * extension, so the route, its chunk and out/dev/audio.html never exist.
 */
const harnessWanted = (phase: string) => phase === PHASE_DEVELOPMENT_SERVER || process.env.AUDIO_HARNESS === "1";

const nextConfig = (phase: string): NextConfig => ({
  pageExtensions: harnessWanted(phase) ? [...PAGE_EXTENSIONS, "dev.tsx"] : PAGE_EXTENSIONS,

  // Dev only: lets phones on the same Wi-Fi open the dev server by its LAN
  // address (e.g. http://192.168.0.106:3000) for audio tests on real devices.
  // Without it, Next.js blocks the dev scripts and the page never becomes
  // interactive there.
  allowedDevOrigins: ["192.168.*.*"],

  // Build: `next build` writes a fully static site to ./out
  output: "export",

  // The dev-only "N" badge sat over the bottom bar's caption and buttons. Errors still show in the overlay.
  devIndicators: false,
});

export default nextConfig;
