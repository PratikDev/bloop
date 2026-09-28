import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the same Wi-Fi open the dev server by its LAN
  // address (e.g. http://192.168.0.106:3000) for audio tests on real devices.
  // Without it, Next.js blocks the dev scripts and the page never becomes
  // interactive there.
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
