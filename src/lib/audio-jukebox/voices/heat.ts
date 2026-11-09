// Heat voice (Then vs Now, Place History): pitch from the anomaly (mapping.json
// "heat"), plus the Anomaly Choir: a second, detuned voice and a ~30 Hz wobble
// for unusual years ("heatDeviation" bands). Triangle through a low-pass, so it
// never sounds like the ocean sine (AUDIO_RESEARCH B2).

import { bandFor, loudnessGain, mapVoice, voiceSpec } from "@/lib/audio/mapping";
import { glideAt, type Graph } from "../graph";

const LOWPASS_HZ = 1800;
const ROUGHNESS_HZ = 30;

export interface HeatVoice {
  at(time: number, anomalyC: number | null): void;
}

export function createHeatVoice(graph: Graph, destination: AudioNode = graph.context): HeatVoice {
  const { ctx } = graph;
  const spec = voiceSpec("heat");
  const dev = voiceSpec("heatDeviation");
  const glideSec = (spec.sound.glideMs ?? 60) / 1000;
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;

  const filter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: LOWPASS_HZ });
  const out = new GainNode(ctx, { gain: 0 });
  // Roughness: amplitude modulation, depth set per step (0 = none).
  const wobble = new GainNode(ctx, { gain: 1 });
  const lfo = new OscillatorNode(ctx, { frequency: ROUGHNESS_HZ });
  const lfoDepth = new GainNode(ctx, { gain: 0 });
  lfo.connect(lfoDepth).connect(wobble.gain);
  filter.connect(wobble).connect(out).connect(destination);

  const main = new OscillatorNode(ctx, { type: "triangle", frequency: 440 });
  const second = new OscillatorNode(ctx, { type: "triangle", frequency: 440 });
  const secondGain = new GainNode(ctx, { gain: 0 });
  main.connect(filter);
  second.connect(secondGain).connect(filter);
  for (const node of [main, second, lfo]) node.start();

  return {
    at(time, anomalyC) {
      const freq = mapVoice("heat", anomalyC);
      if (freq === null || anomalyC === null) {
        glideAt(out.gain, 0, time, releaseSec);
        return;
      }
      const band = dev.mapping?.kind === "bands" ? bandFor(anomalyC, dev.mapping) : null;
      const detune = band?.detuneCents ?? 0;
      glideAt(main.frequency, freq, time, glideSec);
      glideAt(second.frequency, freq * Math.pow(2, detune / 1200), time, glideSec);
      glideAt(secondGain.gain, detune > 0 ? dev.sound.maxGain / spec.sound.maxGain : 0, time, attackSec);
      glideAt(lfoDepth.gain, (band?.roughness ?? 0) * 0.5, time, attackSec);
      glideAt(out.gain, spec.sound.maxGain * loudnessGain(freq), time, attackSec);
    },
  };
}
