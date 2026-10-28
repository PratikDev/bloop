// The rhythm slot as plain clicks: an even click train whose rate follows a mapping.json "clicksPerSecond" rule.
// Scheduled on the shared look-ahead scheduler; no jitter, no accents (plain, by request). null = silence.

import { mapContinuous, continuousRule, panFor, voiceSpec } from "@/lib/audio/mapping";
import type { Graph } from "../graph";
import { addTask } from "../scheduler";

export interface ClickVoice {
  set(value: number | null, lon: number): void;
}

const CLICK_HZ = 2200;

export function createClickVoice(graph: Graph, id: string, bus: AudioNode): ClickVoice {
  const { ctx } = graph;
  const spec = voiceSpec(id);
  const rule = continuousRule(id);
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;
  const filter = new BiquadFilterNode(ctx, { type: "bandpass", frequency: CLICK_HZ, Q: 2 });
  const pan = new StereoPannerNode(ctx, { pan: 0 });
  filter.connect(pan).connect(bus);
  let rate = 0;
  let next = 0;

  function click(time: number) {
    const src = new AudioBufferSourceNode(ctx, { buffer: graph.noise });
    const env = new GainNode(ctx, { gain: 0 });
    src.connect(env).connect(filter);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(spec.sound.maxGain, time + attackSec);
    env.gain.setTargetAtTime(0, time + attackSec, releaseSec / 3);
    src.start(time, Math.random() * 0.5);
    src.stop(time + attackSec + releaseSec * 2);
  }

  addTask((until) => {
    if (rate <= 0) return;
    if (next < ctx.currentTime) next = ctx.currentTime + 0.01;
    while (next < until) {
      click(next);
      next += 1 / rate;
    }
  });

  return {
    set(value, lon) {
      pan.pan.setValueAtTime(panFor(lon), ctx.currentTime);
      rate = mapContinuous(value, rule) ?? 0;
    },
  };
}
