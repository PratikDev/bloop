import { getCtx, getGraph } from "@/lib/audio/context";
import { categoryOfVoice, familyFor, familyNote, noiseBand } from "@/lib/audio/orchestra";
import { track } from "@/lib/audio/sources";
import type { PlayerHandle } from "@/lib/audio/types";
import { NOTE_SEC, songTimes, type Scheduled, type SongPart } from "../lifetime/song";

export type { Scheduled };
const GAIN = 0.18;
const LEAD_SEC = 0.1;
import { orchestraOn } from "../settings";

function drop(ctx: BaseAudioContext, out: AudioNode, t: number) {
  const { source, out: band } = noiseBand(ctx, 2500, 1.2, track);
  const env = new GainNode(ctx, { gain: 0 });
  band.connect(env).connect(out);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(GAIN, t + 0.002);
  env.gain.setTargetAtTime(0, t + 0.002, 0.015);
  source.start(t, (t * 0.37) % 1);
  source.stop(t + 0.1);
}

export function playSong(parts: readonly SongPart[]): { handle: PlayerHandle; times: Scheduled[] } {
  const ctx = getCtx();
  const out = new GainNode(ctx, { gain: 1 });
  out.connect(getGraph().sonification);
  const t0 = ctx.currentTime + LEAD_SEC;
  const times = songTimes(parts, t0);
  let k = 0;
  for (const p of parts) {
    const family = familyFor(categoryOfVoice(p.series.voice), orchestraOn());
    for (const n of p.notes) {
      const t = times[k++].time;
      if (n.hz !== null) familyNote(ctx, out, family, { hz: n.hz, when: t, duration: NOTE_SEC * 0.88, gain: GAIN }, { onSource: track });
      for (let d = 0; d < n.drops; d++) drop(ctx, out, t + (d * NOTE_SEC) / Math.max(1, n.drops));
    }
  }
  const end = (times[times.length - 1]?.time ?? t0) + NOTE_SEC + 0.5;
  let stop: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, (end - ctx.currentTime) * 1000);
    stop = () => {
      clearTimeout(timer);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      resolve();
    };
  });
  return { handle: { stop: () => stop(), done }, times };
}
