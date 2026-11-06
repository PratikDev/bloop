// Ear-test tones for the dev harness (T3, T4): short sine tones on the ocean
// channel (so mute, solo and the voice cap apply), one after another, timed on
// the audio clock. Not part of the public API.

import { getCtx, getGraph } from "./context";
import { loudnessGain, MAPPING, mapVoice } from "./mapping";
import { track } from "./sources";
import { voicePeak } from "./voices/common";

const FADE_SEC = 0.02;
const START_DELAY_SEC = 0.05;

interface Tone {
  freq: number;
  gain: number; // envelope peak (1 = the channel's full voice cap)
}

/** Plays `tones` in turn: `toneSec` each, `gapSec` apart. Returns the total length in seconds. */
function playTones(tones: Tone[], toneSec: number, gapSec: number): number {
  const ctx = getCtx();
  const start = ctx.currentTime + START_DELAY_SEC;
  tones.forEach(({ freq, gain }, i) => {
    const t = start + i * (toneSec + gapSec);
    const osc = track(new OscillatorNode(ctx, { type: "sine", frequency: freq }));
    const env = new GainNode(ctx, { gain: 0 });
    osc.connect(env).connect(getGraph().channels.ocean.input);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + FADE_SEC);
    env.gain.setValueAtTime(gain, t + toneSec - FADE_SEC);
    env.gain.linearRampToValueAtTime(0, t + toneSec);
    osc.start(t);
    osc.stop(t + toneSec + 0.01);
  });
  return START_DELAY_SEC + tones.length * (toneSec + gapSec) - gapSec;
}

/** Ear test T4: two ocean tones (°C through the real ocean rule), 600 ms each, 300 ms apart. */
export function playPitchPair(firstC: number, secondC: number) {
  playTones(
    [firstC, secondC].map((c) => ({ freq: mapVoice("ocean", c) ?? 440, gain: 1 })),
    0.6,
    0.3,
  );
}

/**
 * Ear test T3: tones at the ocean voice's own level with the current loudness
 * compensation (exactly what the live voice would play at those pitches).
 * 1.2 s each, 0.5 s apart. Returns the total length in seconds.
 */
export function playLoudnessSet(freqs: number[]): number {
  const peak = voicePeak("ocean");
  return playTones(
    freqs.map((freq) => ({ freq, gain: peak * loudnessGain(freq) })),
    1.2,
    0.5,
  );
}

/**
 * T3 tuning only: changes the loudness-compensation exponent for this page
 * (live ocean and heat follow it at once). The chosen value goes into
 * public/mapping.json by hand; nothing here is saved.
 */
export function setLoudnessExponent(exponent: number) {
  MAPPING.global.loudnessCompensation.exponent = exponent;
}

export function getLoudnessCompensation(): { refHz: number; exponent: number } {
  return { ...MAPPING.global.loudnessCompensation };
}
