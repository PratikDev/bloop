import type { Metadata } from "next";
import AudioHarness from "@/components/AudioHarness";

export const metadata: Metadata = {
  title: "Audio dev harness",
  description: "L2 test page for the audio engine. Not linked from the app.",
};

export default function AudioHarnessPage() {
  return <AudioHarness />;
}
