import type { Metadata } from "next";
import AudioHarness from "@/components/AudioHarness";

export const metadata: Metadata = {
  title: "Audio dev harness",
  description: "L2 test page for the audio engine. Not linked from the app.",
};

// L2's test page is a dev tool, not part of the demo. The `.dev.tsx` extension is accepted only by `next dev` and by a
// build made with AUDIO_HARNESS=1 (see pageExtensions in next.config.ts), so any other build has no such route.
export default function AudioHarnessPage() {
  return <AudioHarness />;
}
