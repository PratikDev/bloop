import { getCtx, getGraph, peekEngine } from "../../context";
import { channelGain } from "../../mix-trims";
import { fadeTo } from "../../params";
import { track } from "../../sources";
import { voicePeak } from "../../voices/common";
import type { ChordTone } from "../types";

const ROLL_SEC = 0.08;
const ATTACK_SEC = 0.25;
const RELEASE_SEC = 0.4;
const CHORD_DB = -8;
export const PARTIALS = [0, 1, 0.3, 0.1];

const melodyPeak = () => voicePeak("ocean") * channelGain("ocean");
export const chordPeak = () => melodyPeak() * 10 ** (CHORD_DB / 20);

interface Sounding {
  osc: OscillatorNode;
  env: GainNode;
}

let live: Sounding[] = [];

function release(nodes: readonly Sounding[]) {
  if (!peekEngine()) return;
  const ctx = getCtx();
  for (const n of nodes) {
    fadeTo(ctx, n.env.gain, 0, RELEASE_SEC);
    n.osc.stop(ctx.currentTime + RELEASE_SEC + 0.05);
  }
}

export function soundTones(tones: readonly ChordTone[]) {
  release(live);
  live = [];
  if (!peekEngine() || !tones.length) return;
  const ctx = getCtx();
  const wave = new PeriodicWave(ctx, { real: new Float32Array(PARTIALS.length), imag: Float32Array.from(PARTIALS), disableNormalization: true });
  const t0 = ctx.currentTime;
  live = [...tones]
    .sort((a, b) => a.hz - b.hz)
    .map((tone, i) => {
      const env = new GainNode(ctx, { gain: 0 });
      const osc = track(new OscillatorNode(ctx, { frequency: tone.hz, periodicWave: wave }));
      osc.connect(env).connect(getGraph().sonification);
      const at = t0 + i * ROLL_SEC;
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(tone.gain, at + ATTACK_SEC);
      osc.start(at);
      return { osc, env };
    });
}

export function silenceTones() {
  release(live);
  live = [];
}

export function forgetTones() {
  live = [];
}
