import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the same Wi-Fi open the dev server by its LAN
  // address (e.g. http://192.168.0.106:3000) for audio tests on real devices.
  // Without it, Next.js blocks the dev scripts and the page never becomes
  // interactive there.
  allowedDevOrigins: ["192.168.*.*"],

  // Build: `next build` writes a fully static site to ./out
  output: "export",

  // The dev-only "N" badge sat over the bottom bar's caption and buttons. Errors still show in the overlay.
  devIndicators: false,
};

export default nextConfig;
