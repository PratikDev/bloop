// The water voice (Then vs Now, TEAM_BUILD_PLAN §10): GRACE water storage as a
// bass line, 80–320 Hz across the 5th–95th percentile of the series being
// played. 2nd and 3rd harmonics keep the pitch audible on phone speakers
// (AUDIO_RESEARCH B3, ear test T5). A month with no measurement is silence.

import { waterFreq, waterRange } from "../context-maths";
import { getCtx } from "../context";
import { voiceSpec } from "../mapping";
import { glideAt, jumpAt } from "../params";
import { track } from "../sources";
import { onStopAll } from "../stop";
import { voicePeak, type VoiceTiming } from "./common";

const HARMONICS = [1, 0.5, 0.25]; // fundamental, 2nd, 3rd (T5 decides)
const HARMONIC_SUM = HARMONICS.reduce((a, b) => a + b, 0);

let harmonicsOn = true;

/** Ear test T5 only: compare the bass with and without its harmonics. */
export function setBassHarmonics(on: boolean) {
  harmonicsOn = on;
}

/** Each partial's level; without harmonics the fundamental alone carries the whole level. */
const partialLevel = (i: number) => (harmonicsOn ? HARMONICS[i] / HARMONIC_SUM : i === 0 ? 1 : 0);

export interface BassVoice {
  /** Sets the pitch range from the whole series about to be played (nulls ignored). */
  prepare(series: readonly (number | null)[]): void;
  /** cm (null = no satellite measurement → silence), now or at `at.time`. */
  set(cm: number | null, at?: VoiceTiming): void;
}

export function createBassVoice(output: AudioNode): BassVoice {
  const spec = voiceSpec("water").sound;
  const attackSec = spec.attackMs / 1000;
  const releaseSec = spec.releaseMs / 1000;
  const glideSec = (spec.glideMs ?? 40) / 1000;
  const level = voicePeak("water");

  let range: { min: number; max: number } | null = null;
  let nodes: { oscs: OscillatorNode[]; gains: GainNode[]; env: GainNode } | null = null;
  let sounding = false;

  onStopAll(() => {
    nodes = null;
    sounding = false;
  });

  function build(freq: number) {
    const ctx = getCtx();
    const env = new GainNode(ctx, { gain: 0 });
    env.connect(output);
    const oscs = HARMONICS.map((_, i) => track(new OscillatorNode(ctx, { type: "sine", frequency: freq * (i + 1) })));
    const gains = oscs.map((osc, i) => {
      const g = new GainNode(ctx, { gain: partialLevel(i) });
      osc.connect(g).connect(env);
      osc.start();
      return g;
    });
    return { oscs, gains, env };
  }

  return {
    prepare(series) {
      range = waterRange(series);
    },
    set(cm, at = {}) {
      const ctx = getCtx();
      const freq = range && cm !== null ? waterFreq(cm, range) : null;
      if (freq === null) {
        if (sounding && nodes) glideAt(ctx, nodes.env.gain, 0, releaseSec, at.time);
        sounding = false;
        return;
      }
      nodes ??= build(freq);
      const n = nodes;
      n.oscs.forEach((osc, i) => {
        const f = freq * (i + 1);
        if (sounding) glideAt(ctx, osc.frequency, f, at.glideSec ?? glideSec, at.time);
        else jumpAt(ctx, osc.frequency, f, at.time);
      });
      n.gains.forEach((g, i) => glideAt(ctx, g.gain, partialLevel(i), glideSec, at.time));
      glideAt(ctx, n.env.gain, level, sounding ? glideSec : attackSec, at.time);
      sounding = true;
    },
  };
}
