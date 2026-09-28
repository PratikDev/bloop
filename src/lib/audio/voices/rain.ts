// The rain voice (TEAM_BUILD_PLAN §10, AUDIO_RESEARCH A4): each drop is a
// short burst from the one shared noise buffer, through one shared band-pass
// filter, so up to 40 drops per second stay cheap. The monsoon voice (Then vs
// Now) uses the same drop sound.

import { getCtx, getNoise } from "../context";
import { voiceSpec } from "../mapping";
import { blip } from "../params";
import { track } from "../sources";
import { createDropVoice, type DropVoice } from "./drops";

const BANDPASS_HZ = 2500; // tune by ear (D6)
const BANDPASS_Q = 1.2;
const DROP_LENGTH_SEC = 0.1;

/** The shared band-pass a drop voice's drops go through, feeding `dest`. */
export function createDropFilter(dest: AudioNode): BiquadFilterNode {
  const filter = new BiquadFilterNode(getCtx(), { type: "bandpass", frequency: BANDPASS_HZ, Q: BANDPASS_Q });
  filter.connect(dest);
  return filter;
}

/** One noise-burst drop at `time`, shaped by the voice's mapping.json envelope. */
export function playNoiseDrop(id: "rain" | "monsoon", time: number, peak: number, out: AudioNode) {
  const ctx = getCtx();
  const noise = getNoise();
  const { attackMs, releaseMs } = voiceSpec(id).sound;
  const src = track(new AudioBufferSourceNode(ctx, { buffer: noise }));
  const env = new GainNode(ctx, { gain: 0 });
  src.connect(env).connect(out);
  blip(env.gain, time, peak, attackMs / 1000, releaseMs / 1000);
  src.start(time, Math.random() * (noise.duration - DROP_LENGTH_SEC));
  src.stop(time + DROP_LENGTH_SEC);
}

export function createRainVoice(): DropVoice {
  return createDropVoice("rain", (time, peak, out) => playNoiseDrop("rain", time, peak, out), createDropFilter);
}
