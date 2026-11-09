import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VoiceGate } from "@/components/VoiceGate";

export const metadata: Metadata = {
  title: "Voice gate test",
  description: "Ask Bloop's speech recognition gate test (docs/voice/GATE_TEST.md). Not linked from the app.",
};

// A dev tool, as the audio harness: a production build serves a 404 here unless built with VOICE_GATE=1 (a test
// deploy for the team's gate test). Read at build time (static page).
const gateEnabled = process.env.NODE_ENV !== "production" || process.env.VOICE_GATE === "1";

export default function VoiceGatePage() {
  if (!gateEnabled) notFound();
  return <VoiceGate />;
}
