import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AudioHarness from "@/components/AudioHarness";

export const metadata: Metadata = {
  title: "Audio dev harness",
  description: "L2 test page for the audio engine. Not linked from the app.",
};

// L2's test page is a dev tool, not part of the demo: a production build serves
// a 404 here unless it is built with AUDIO_HARNESS=1 (e.g. a test deploy for
// teammates' ear tests on their phones). Read at build time (static page).
const harnessEnabled = process.env.NODE_ENV !== "production" || process.env.AUDIO_HARNESS === "1";

export default function AudioHarnessPage() {
  if (!harnessEnabled) notFound();
  return <AudioHarness />;
}
