// Water voice: a low sine with 2nd and 3rd harmonics so the pitch survives
// phone speakers (AUDIO_RESEARCH B3). Pitch range = 5th–95th percentile of the
// series being played (mapping.json "water"). A missing month is silence.

import { loudnessGain, mapRuntime, runtimeRange, voiceSpec } from "@/lib/audio/mapping";
import { glideAt, type Graph } from "../graph";

const HARMONICS: readonly [number, number][] = [
  [1, 1],
  [2, 0.5],
  [3, 0.25],
];

export interface BassVoice {
  /** Fix the pitch range from the whole series before playing it. */
  prepare(series: readonly (number | null)[]): void;
  at(time: number, cm: number | null): void;
}

export function createBassVoice(graph: Graph, destination: AudioNode = graph.context): BassVoice {
  const { ctx } = graph;
  const spec = voiceSpec("water");
  const mapping = spec.mapping?.kind === "runtimeRange" ? spec.mapping : null;
  const glideSec = (spec.sound.glideMs ?? 40) / 1000;
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;
  const norm = HARMONICS.reduce((sum, [, g]) => sum + g, 0);

  const out = new GainNode(ctx, { gain: 0 });
  out.connect(destination);
  const oscs = HARMONICS.map(([ratio, g]) => {
    const osc = new OscillatorNode(ctx, { frequency: 110 * ratio });
    osc.connect(new GainNode(ctx, { gain: g / norm })).connect(out);
    osc.start();
    return { osc, ratio };
  });
  let range: { min: number; max: number } | null = null;

  return {
    prepare(series) {
      range = mapping ? runtimeRange(series, mapping.input) : null;
    },
    at(time, cm) {
      const freq = mapping && range ? mapRuntime(cm, mapping, range) : null;
      if (freq === null) {
        glideAt(out.gain, 0, time, releaseSec);
        return;
      }
      for (const { osc, ratio } of oscs) glideAt(osc.frequency, freq * ratio, time, glideSec);
      glideAt(out.gain, spec.sound.maxGain * loudnessGain(freq), time, attackSec);
    },
  };
}
