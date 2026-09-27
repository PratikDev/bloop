// The ocean voice (TEAM_BUILD_PLAN §10): a warm sine whose pitch follows sea
// surface temperature (mapping.json "ocean"), gliding between values, fading
// to honest silence over land / no data, panned by longitude.

import { getCtx } from "../context";
import { loudnessGain, mapVoice, voiceSpec } from "../mapping";
import { fadeTo, glideTo } from "../params";
import { track } from "../sources";
import { onStopAll } from "../stop";
import { createVoiceOutput, panTo, voicePeak } from "./common";

export interface OceanVoice {
  /** °C (null = land / no data → silence) at a longitude (stereo). */
  set(valueC: number | null, lon: number): void;
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
  let sounding = false;

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
    set(valueC, lon) {
      const freq = mapVoice("ocean", valueC);
      const ctx = getCtx();
      if (freq === null) {
        if (sounding && env) fadeTo(ctx, env.gain, 0, releaseSec);
        sounding = false;
        return;
      }
      const nodes = ensureOscillator(freq);
      const level = peak * loudnessGain(freq);
      if (sounding) {
        glideTo(ctx, nodes.osc.frequency, freq, glideSec);
        glideTo(ctx, nodes.env.gain, level, glideSec);
      } else {
        // Coming out of silence: jump to the new pitch while silent, then fade in.
        nodes.osc.frequency.cancelScheduledValues(ctx.currentTime);
        nodes.osc.frequency.setValueAtTime(freq, ctx.currentTime);
        fadeTo(ctx, nodes.env.gain, level, attackSec);
      }
      panTo(panner, lon);
      sounding = true;
    },
  };
}
