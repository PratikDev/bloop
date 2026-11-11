import { continuousRule, panFor, voiceSpec } from "@/lib/audio/mapping";
import { BRIGHTNESS_VOICE, GEIGER_VOICE, poissonGap } from "../geiger";
import { addTask, dataOut, report } from "./out";

const FALLBACK_CUTOFF = () => continuousRule(BRIGHTNESS_VOICE).output.min;

interface GeigerLayer {
  set(rate: number, cutoffHz: number | null, lon: number): void;
  stop(): void;
  clicks(): number;
}

export function createGeigerLayer(random: () => number = Math.random): GeigerLayer {
  const spec = voiceSpec(GEIGER_VOICE);
  const attack = spec.sound.attackMs / 1000;
  const release = spec.sound.releaseMs / 1000;
  let rate = 0;
  let cutoff: number | null = null;
  let next = 0;
  let count = 0;
  let nodes: { filter: BiquadFilterNode; pan: StereoPannerNode } | null = null;
  let untask: (() => void) | null = null;

  function click(time: number) {
    const out = dataOut();
    if (!out || !nodes) return;
    const { graph } = out;
    const src = new AudioBufferSourceNode(graph.ctx, { buffer: graph.noise });
    const env = new GainNode(graph.ctx, { gain: 0 });
    src.connect(env).connect(nodes.filter);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(spec.sound.maxGain, time + attack);
    env.gain.setTargetAtTime(0, time + attack, release / 3);
    src.start(time, random() * 0.5);
    src.stop(time + attack + release * 2);
    count += 1;
  }

  const task = (until: number) => {
    const out = dataOut();
    if (!out || rate <= 0) return;
    const now = out.graph.ctx.currentTime;
    if (next < now) next = now + poissonGap(rate, random);
    while (next < until) {
      click(next);
      next += poissonGap(rate, random);
    }
    report("geiger", { rate, cutoffHz: cutoff, clicks: count });
  };

  return {
    set(r, c, lon) {
      const out = dataOut();
      if (!out) return;
      const ctx = out.graph.ctx;
      if (!nodes) {
        const filter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: FALLBACK_CUTOFF(), Q: 0.8 });
        const pan = new StereoPannerNode(ctx, { pan: 0 });
        filter.connect(pan).connect(out.bus);
        nodes = { filter, pan };
      }
      untask ??= addTask(task);
      if (r !== rate) {
        next = 0;
        count = 0;
      }
      rate = r;
      cutoff = c;
      nodes.filter.frequency.setTargetAtTime(c ?? FALLBACK_CUTOFF(), ctx.currentTime, 0.02);
      nodes.pan.pan.setTargetAtTime(panFor(lon), ctx.currentTime, 0.05);
      report("geiger", { rate, cutoffHz: cutoff, clicks: count });
    },
    stop() {
      rate = 0;
      untask?.();
      untask = null;
      report("geiger", { rate: 0, cutoffHz: null, clicks: count });
    },
    clicks: () => count,
  };
}
