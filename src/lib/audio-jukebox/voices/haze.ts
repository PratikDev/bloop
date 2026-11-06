// "Hearing through haze" (book §5.4 air rule): soft looping noise through a low-pass filter whose cutoff follows a
// mapping.json "cutoff" rule (falling: more pollution, lower cutoff, more muffled). The level is fixed, so loudness
// carries no data (guardrail 4); only the brightness moves.

import { continuousRule, mapContinuous, panFor, voiceSpec } from "@/lib/audio/mapping";
import { glideTo, type Graph } from "../graph";

export interface HazeVoice {
  set(value: number | null, lon: number): void;
}

export function createHazeVoice(graph: Graph, id: string, bus: AudioNode): HazeVoice {
  const { ctx } = graph;
  const spec = voiceSpec(id);
  const rule = continuousRule(id);
  const glideSec = (spec.sound.glideMs ?? 60) / 1000;
  const src = new AudioBufferSourceNode(ctx, { buffer: graph.noise, loop: true });
  const filter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: rule.output.max, Q: 0.7 });
  const gain = new GainNode(ctx, { gain: 0 });
  const pan = new StereoPannerNode(ctx, { pan: 0 });
  src.connect(filter).connect(gain).connect(pan).connect(bus);
  src.start();

  return {
    set(value, lon) {
      const cutoff = mapContinuous(value, rule);
      glideTo(ctx, pan.pan, panFor(lon), glideSec);
      if (cutoff === null) {
        glideTo(ctx, gain.gain, 0, spec.sound.releaseMs / 1000);
        return;
      }
      glideTo(ctx, filter.frequency, cutoff, glideSec);
      glideTo(ctx, gain.gain, spec.sound.maxGain, spec.sound.attackMs / 1000);
    },
  };
}
