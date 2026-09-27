// Monsoon voice (Then vs Now, Place History): each step plays exactly the
// rule's number of drops (mapping.json "monsoon", drops per step), spread
// evenly across the step with a little jitter.

import { mapVoice, voiceSpec } from "@/lib/audio/mapping";
import type { Graph } from "../graph";
import { createRainDropSound } from "./drops";

const JITTER = 0.25;

export interface MonsoonVoice {
  at(time: number, mmPerDay: number | null, stepSec: number): void;
}

export function createMonsoonVoice(graph: Graph, destination: AudioNode = graph.context): MonsoonVoice {
  const spec = voiceSpec("monsoon");
  const drop = createRainDropSound(graph, destination, spec.sound.attackMs / 1000, spec.sound.releaseMs / 1000);
  return {
    at(time, mmPerDay, stepSec) {
      const count = mapVoice("monsoon", mmPerDay) ?? 0; // null → silence
      const gap = stepSec / Math.max(count, 1);
      for (let i = 0; i < count; i++) {
        drop(time + gap * (i + 0.5 + (Math.random() - 0.5) * JITTER), spec.sound.maxGain);
      }
    },
  };
}
