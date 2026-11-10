// The landslide exposure rumble (P3): a class's fixed rumble from the "landslideRumble" rule: noise through a low-pass
// at a fixed cutoff, a fixed gain, and slow amplitude pulses for the highest class. Thresholded events: the state jumps
// with the class, never a continuous pitch. "None shown" and "low" are stated silences.

import { panFor, voiceSpec } from "@/lib/audio/mapping";
import { classesRule, classState } from "../classes";
import { dataOut, report } from "./out";

const FADE_SEC = 0.25;
/** How deep the pulses go (share of the rumble's gain), a design choice. */
const PULSE_DEPTH = 0.8;

export interface RumbleLayer {
  set(code: number | null, lon: number): void;
  stop(): void;
}

export function createRumbleLayer(voiceId: string): RumbleLayer {
  const rule = classesRule(voiceId);
  const maxGain = voiceSpec(voiceId).sound.maxGain;
  let nodes: { src: AudioBufferSourceNode; filter: BiquadFilterNode; level: GainNode; pulse: GainNode; lfo: OscillatorNode; lfoDepth: GainNode; pan: StereoPannerNode } | null = null;
  let current: number | null | undefined;

  function build() {
    const out = dataOut();
    if (!out) return null;
    const { graph, bus } = out;
    const ctx = graph.ctx;
    const src = new AudioBufferSourceNode(ctx, { buffer: graph.noise, loop: true });
    const filter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 120, Q: 0.7 });
    const pulse = new GainNode(ctx, { gain: 1 });
    const level = new GainNode(ctx, { gain: 0 });
    const pan = new StereoPannerNode(ctx, { pan: 0 });
    const lfo = new OscillatorNode(ctx, { type: "sine", frequency: 0 });
    const lfoDepth = new GainNode(ctx, { gain: 0 });
    lfo.connect(lfoDepth).connect(pulse.gain);
    src.connect(filter).connect(pulse).connect(level).connect(pan).connect(bus);
    src.start();
    lfo.start();
    return { src, filter, level, pulse, lfo, lfoDepth, pan };
  }

  return {
    set(code, lon) {
      nodes ??= build();
      if (!nodes) return;
      const ctx = nodes.src.context;
      const now = ctx.currentTime;
      nodes.pan.pan.setTargetAtTime(panFor(lon), now, 0.05);
      if (code === current) return;
      current = code;
      const state = code === null ? null : classState(rule, code);
      const r = state?.sound === "rumble" ? state.rumble : undefined;
      if (!r) {
        nodes.level.gain.setTargetAtTime(0, now, FADE_SEC / 3);
        report("rumble", { code, cutoffHz: null, pulses: 0 });
        return;
      }
      // HOOK: orchestra (land): the rumble is the Land and life family's ground layer at integration.
      nodes.filter.frequency.setTargetAtTime(r.cutoffHz, now, FADE_SEC / 3);
      nodes.level.gain.setTargetAtTime(maxGain * r.gain, now, FADE_SEC / 3);
      // Pulses: gain 1 − depth/2 ± depth/2 at pulsesPerSecond (none = steady at 1).
      nodes.pulse.gain.setValueAtTime(r.pulsesPerSecond > 0 ? 1 - PULSE_DEPTH / 2 : 1, now);
      nodes.lfoDepth.gain.setValueAtTime(r.pulsesPerSecond > 0 ? PULSE_DEPTH / 2 : 0, now);
      nodes.lfo.frequency.setValueAtTime(r.pulsesPerSecond, now);
      report("rumble", { code, cutoffHz: r.cutoffHz, pulses: r.pulsesPerSecond });
    },
    stop() {
      if (nodes) nodes.level.gain.setTargetAtTime(0, nodes.src.context.currentTime, FADE_SEC / 3);
      current = undefined;
      report("rumble", { code: null, cutoffHz: null, pulses: 0 });
    },
  };
}
