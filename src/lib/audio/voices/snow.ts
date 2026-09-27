// The snow voice (TEAM_BUILD_PLAN §10): soft bells at the same density rule
// as rain. One bell is synthesised once into a buffer (sine partials with a
// slow decay), then replayed per bell, so dense snow stays as cheap as rain.

import { getCtx } from "../context";
import { voiceSpec } from "../mapping";
import { track } from "../sources";
import { createDropVoice, type DropVoice } from "./drops";

const BELL_HZ = 1200; // tune by ear (D6)
const TAIL_FADE_SEC = 0.02;
const PARTIALS = [
  { ratio: 1, amp: 1, decaySec: 0.18 },
  { ratio: 2.76, amp: 0.4, decaySec: 0.09 },
  { ratio: 5.4, amp: 0.2, decaySec: 0.05 },
];

function synthesiseBell(ctx: BaseAudioContext, attackSec: number, lengthSec: number): AudioBuffer {
  const buffer = new AudioBuffer({ length: Math.round(ctx.sampleRate * lengthSec), sampleRate: ctx.sampleRate });
  const data = buffer.getChannelData(0);
  let max = 0;
  const fadeOutSamples = Math.round(ctx.sampleRate * TAIL_FADE_SEC);
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate;
    // linear fade in, and a short fade out so the buffer never ends mid-wave (no click)
    const envelope = Math.min(1, t / attackSec, (data.length - i) / fadeOutSamples);
    let v = 0;
    for (const p of PARTIALS) v += p.amp * Math.exp(-t / p.decaySec) * Math.sin(2 * Math.PI * BELL_HZ * p.ratio * t);
    data[i] = v * envelope;
    max = Math.max(max, Math.abs(data[i]));
  }
  for (let i = 0; i < data.length; i++) data[i] /= max; // peak 1
  return buffer;
}

export function createSnowVoice(): DropVoice {
  const { attackMs, releaseMs } = voiceSpec("snow").sound;
  const bell = synthesiseBell(getCtx(), attackMs / 1000, (releaseMs * 1.5) / 1000);

  return createDropVoice("snow", (time, peak, out) => {
    const ctx = getCtx();
    const src = track(new AudioBufferSourceNode(ctx, { buffer: bell }));
    const gain = new GainNode(ctx, { gain: peak });
    src.connect(gain).connect(out);
    src.start(time);
  });
}
