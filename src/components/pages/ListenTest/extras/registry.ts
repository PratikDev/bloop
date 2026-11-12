// The listener test's extra task modules, in the order they run after the five core tasks: ONE list, one line per
// module. ART: emotion ratings and ear vs eye (and `testVersion`, src/lib/listen-test/results.ts). CV adds its two
// chord tasks here the same way. Each module stores its answers under extras[info.id].

import type { ComponentType } from "react";
import type { PlayerHandle } from "@/lib/audio-jukebox/types";
import { EAR_EYE } from "@/lib/listen-test/extras/ear-eye";
import { EMOTION } from "@/lib/listen-test/extras/emotion";
import type { ExtraRecord, ExtraTaskInfo } from "@/lib/listen-test/extras/types";
import type { MessageKey } from "@/lib/i18n";
import type { SstTruthPair } from "@/types/data-contract";
import { EarEyeTask } from "./EarEyeTask";
import { EmotionTask } from "./EmotionTask";

export interface ExtraStepProps {
  /** What the core test loaded (the checked ocean points). */
  inputs: { pairs: readonly SstTruthPair[] };
  /** Plays a sound through the test's own player (stops the last one first; Stop and the next step stop it). */
  play(start: () => PlayerHandle): void;
  /** Counterbalancing coins in [0, 1), drawn once per session when the extra tasks start (never during render). */
  coins: readonly [number, number];
  /** The module's answers; the test moves on. */
  onDone(records: ExtraRecord[]): void;
}

export interface ExtraModule {
  info: ExtraTaskInfo;
  /** The step's heading. */
  heading: MessageKey;
  Step: ComponentType<ExtraStepProps>;
}

export const EXTRA_MODULES: readonly ExtraModule[] = [
  { info: EMOTION, heading: "ltx.emotion.heading", Step: EmotionTask },
  { info: EAR_EYE, heading: "ltx.eye.heading", Step: EarEyeTask },
];
