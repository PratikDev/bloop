// The rain voice (TEAM_BUILD_PLAN §10, AUDIO_RESEARCH A4): each drop is a
// short burst from the one shared noise buffer, through one shared band-pass
// filter, so up to 40 drops per second stay cheap.

import { getCtx, getNoise } from "../context";
import { voiceSpec } from "../mapping";
import { blip } from "../params";
import { track } from "../sources";
import { createDropVoice, type DropVoice } from "./drops";

const BANDPASS_HZ = 2500; // tune by ear (D6)
const BANDPASS_Q = 1.2;
const DROP_LENGTH_SEC = 0.1;

export function createRainVoice(): DropVoice {
  const { attackMs, releaseMs } = voiceSpec("rain").sound;
  const attackSec = attackMs / 1000;
  const decaySec = releaseMs / 1000;

  return createDropVoice(
    "rain",
    (time, peak, out) => {
      const ctx = getCtx();
      const noise = getNoise();
      const src = track(new AudioBufferSourceNode(ctx, { buffer: noise }));
      const env = new GainNode(ctx, { gain: 0 });
      src.connect(env).connect(out);
      blip(env.gain, time, peak, attackSec, decaySec);
      src.start(time, Math.random() * (noise.duration - DROP_LENGTH_SEC));
      src.stop(time + DROP_LENGTH_SEC);
    },
    (panner) => {
      const filter = new BiquadFilterNode(getCtx(), { type: "bandpass", frequency: BANDPASS_HZ, Q: BANDPASS_Q });
      filter.connect(panner);
      return filter;
    },
  );
}
