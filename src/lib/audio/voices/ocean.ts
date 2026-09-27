// The ocean voice (TEAM_BUILD_PLAN §10): a warm sine whose pitch follows sea
// surface temperature (mapping.json "ocean"), gliding between values, fading
// to honest silence over land / no data, panned by longitude. Changes happen
// now, or at an exact audio-clock time for sequences scheduled ahead.

import { getCtx } from "../context";
import { loudnessGain, mapVoice, voiceSpec } from "../mapping";
import { glideAt, jumpAt } from "../params";
import { track } from "../sources";
import { onStopAll } from "../stop";
import { createVoiceOutput, panTo, voicePeak, type VoiceTiming } from "./common";

export interface OceanVoice {
  /** °C (null = land / no data → silence) at a longitude (stereo), now or at `at.time`. */
  set(valueC: number | null, lon: number, at?: VoiceTiming): void;
}

export function createOceanVoice(): OceanVoice {
  const spec = voiceSpec("ocean").sound;
  const attackSec = spec.attackMs / 1000;
  const releaseSec = spec.releaseMs / 1000;
  const glideSec = (spec.glideMs ?? 30) / 1000;
  const peak = voicePeak("ocean");
  const panner = createVoiceOutput("ocean");

  let osc: OscillatorNode | null = null;
  let env: GainNode | null = null;
  let sounding = false; // as scheduled (calls arrive in time order)

  // stopAll() stops the oscillator; start a fresh one next time.
  onStopAll(() => {
    osc = null;
    env = null;
    sounding = false;
  });

  function ensureOscillator(freq: number) {
    if (osc && env) return { osc, env };
    const ctx = getCtx();
    env = new GainNode(ctx, { gain: 0 });
    osc = track(new OscillatorNode(ctx, { type: "sine", frequency: freq }));
    osc.connect(env).connect(panner);
    osc.start();
    return { osc, env };
  }

  return {
    set(valueC, lon, at = {}) {
      const ctx = getCtx();
      const freq = mapVoice("ocean", valueC);
      if (freq === null) {
        if (sounding && env) glideAt(ctx, env.gain, 0, releaseSec, at.time);
        sounding = false;
        return;
      }
      const nodes = ensureOscillator(freq);
      const level = peak * loudnessGain(freq);
      if (sounding) {
        const glide = at.glideSec ?? glideSec;
        glideAt(ctx, nodes.osc.frequency, freq, glide, at.time);
        glideAt(ctx, nodes.env.gain, level, glide, at.time);
      } else {
        // Coming out of silence: jump to the new pitch while silent, then fade in.
        jumpAt(ctx, nodes.osc.frequency, freq, at.time);
        glideAt(ctx, nodes.env.gain, level, attackSec, at.time);
      }
      panTo(panner, lon, at.time);
      sounding = true;
    },
  };
}
