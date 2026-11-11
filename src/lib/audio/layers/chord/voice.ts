// The chord's sound: a soft pad (a sine with weak 2nd and 3rd harmonics, slow attack), clearly unlike the melody's warm
// sine with its quick glide, on the sonification bus (ducked with it, silenced by Mute all and Esc). Each tone's
// fundamental is exactly its ChordTone.hz. New tones roll in low → high, ROLL_SEC apart, then hold.
import { getCtx, getGraph, peekEngine } from "../../context";
import { channelGain } from "../../mix-trims";
import { fadeTo } from "../../params";
import { track } from "../../sources";
import { voicePeak } from "../../voices/common";
import type { ChordTone } from "../types";

const ROLL_SEC = 0.08;
const ATTACK_SEC = 0.25;
const RELEASE_SEC = 0.4;
/** The chord sits this many dB under the melody's peak (docs/audio/MIX.md: measured there). */
const CHORD_DB = -8;
/** Partials of the pad (fundamental first): timbre only, the pitch is the fundamental's. */
export const PARTIALS = [0, 1, 0.3, 0.1];

/** The melody's peak level on the sonification bus (the ocean voice: its peak × its channel's input gain, the cap
 *  times the mix trim), so the chord stays CHORD_DB under the melody it describes. */
const melodyPeak = () => voicePeak("ocean") * channelGain("ocean");
/** The chord's total peak: CHORD_DB under the melody, shared between the tones by their area fractions. */
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

/** Plays `tones` (replacing what sounds), rolled low → high. A no-op before Start. */
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

/** Fades every chord tone out. */
export function silenceTones() {
  release(live);
  live = [];
}

/** After Esc the sources are already stopped (sources.ts): forget them. */
export function forgetTones() {
  live = [];
}
