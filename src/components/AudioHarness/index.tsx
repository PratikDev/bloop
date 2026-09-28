"use client";

import ClipSection from "./ClipSection";
import EventLog from "./EventLog";
import LegendSection from "./LegendSection";
import LiveSection from "./LiveSection";
import LoudnessSection from "./LoudnessSection";
import MixerSection from "./MixerSection";
import PitchPairSection from "./PitchPairSection";
import SchedulerSection from "./SchedulerSection";
import SequenceSection from "./SequenceSection";
import SpeechSection from "./SpeechSection";
import StartSection from "./StartSection";
import StormSection from "./StormSection";
import ThenNowSection from "./ThenNowSection";
import ToneSection from "./ToneSection";
import { useAudioEvents } from "./use-audio-events";
import { useStopOnEscape } from "./use-stop-on-escape";

/**
 * L2's dev harness (/dev/audio): one section per build phase, used to run each
 * phase's manual checklist in docs/L2/BUILD_PLAN.md.
 */
export default function AudioHarness() {
  const { events, ready, clear } = useAudioEvents();
  useStopOnEscape();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold">Audio dev harness</h1>
        <p className="text-sm text-muted-foreground">
          L2 test page. Use headphones and a laptop speaker. Esc stops everything.
        </p>
      </header>
      <StartSection ready={ready} />
      <ToneSection ready={ready} />
      <SchedulerSection ready={ready} />
      <MixerSection ready={ready} />
      <LiveSection ready={ready} />
      <PitchPairSection ready={ready} />
      <SpeechSection ready={ready} />
      <LegendSection ready={ready} />
      <SequenceSection ready={ready} />
      <ThenNowSection ready={ready} />
      <StormSection ready={ready} />
      <LoudnessSection ready={ready} />
      <ClipSection ready={ready} />
      <EventLog events={events} onClear={clear} />
    </main>
  );
}
