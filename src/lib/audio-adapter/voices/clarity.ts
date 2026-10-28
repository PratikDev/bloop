// Freshness as clarity (idea C5; mapping.json "clarity"): an echo tail on the ocean voice whose
// length follows MUR's hours since a 1 km infrared look. Two damped feedback combs; only their
// decay time changes (T60 from the rule), the send level is fixed, so loudness carries no data
// (guardrail 4). Not a low-pass: muffling is the air voice's cue.

import { continuousRule, mapContinuous, voiceSpec } from "@/lib/audio/mapping";
import type { Clarity } from "@/lib/data";
import { glideTo, type Graph } from "../graph";

const COMB_DELAYS_SEC = [0.0297, 0.0371]; // mutually prime, so the tail doesn't ring at one pitch
const DAMPING_HZ = 3500;
const MAX_FEEDBACK = 0.95;

export interface ClarityEcho {
  set(c: Clarity): void;
}

/** T60 (s) → feedback gain for a comb of delay d: the loop loses 60 dB in T60. */
const feedbackFor = (delaySec: number, t60: number) => Math.min(MAX_FEEDBACK, Math.pow(10, (-3 * delaySec) / t60));

export function createClarityEcho(graph: Graph, source: AudioNode): ClarityEcho {
  const { ctx } = graph;
  const spec = voiceSpec("clarity");
  const rule = continuousRule("clarity");
  const glideSec = spec.sound.attackMs / 1000;
  const send = new GainNode(ctx, { gain: spec.sound.maxGain });
  const out = new GainNode(ctx, { gain: 0 });
  source.connect(send);
  out.connect(graph.fade);
  const loops = COMB_DELAYS_SEC.map((d) => {
    const delay = new DelayNode(ctx, { delayTime: d, maxDelayTime: d });
    const damp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: DAMPING_HZ });
    const feedback = new GainNode(ctx, { gain: 0 });
    send.connect(delay).connect(damp).connect(feedback).connect(delay);
    damp.connect(out);
    return { d, feedback };
  });

  return {
    set(c) {
      const hours = c === null ? null : c.kind === "noLook" ? rule.input.max : c.hours;
      const t60 = mapContinuous(hours, rule);
      glideTo(ctx, out.gain, t60 === null ? 0 : 1, glideSec);
      for (const { d, feedback } of loops) glideTo(ctx, feedback.gain, t60 === null ? 0 : feedbackFor(d, t60), glideSec);
    },
  };
}
