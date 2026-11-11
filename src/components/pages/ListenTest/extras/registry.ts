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
  inputs: { pairs: readonly SstTruthPair[] };
  play(start: () => PlayerHandle): void;
  coins: readonly [number, number];
  onDone(records: ExtraRecord[]): void;
}

interface ExtraModule {
  info: ExtraTaskInfo;
  heading: MessageKey;
  Step: ComponentType<ExtraStepProps>;
}

export const EXTRA_MODULES: readonly ExtraModule[] = [
  { info: EMOTION, heading: "ltx.emotion.heading", Step: EmotionTask },
  { info: EAR_EYE, heading: "ltx.eye.heading", Step: EarEyeTask },
];
