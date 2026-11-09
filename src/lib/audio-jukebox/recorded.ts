// The "recorded" texture (guardrail 16; mapping.json "recorded"): a soft, steady hiss under a
// live track whose data is older than its freshness limit, so stale data never sounds live.
// Fixed level, band-limited away from the no-data tick; it sounds only while that track does.

import { voiceSpec } from "@/lib/audio/mapping";
import { glideTo, type Graph } from "./graph";

const HISS_BAND_HZ = 1200;
const HISS_Q = 0.5;

export type RecordedTrack = "ocean" | "rain";

export interface RecordedTexture {
  /** Whether each track's data is past its limit, and whether that track is sounding now. */
  update(state: Record<RecordedTrack, { stale: boolean; sounding: boolean }>): void;
}

export function createRecordedTexture(graph: Graph): RecordedTexture {
  const { ctx } = graph;
  const spec = voiceSpec("recorded").sound;
  const src = new AudioBufferSourceNode(ctx, { buffer: graph.noise, loop: true });
  const band = new BiquadFilterNode(ctx, { type: "bandpass", frequency: HISS_BAND_HZ, Q: HISS_Q });
  const gain = new GainNode(ctx, { gain: 0 });
  src.connect(band).connect(gain).connect(graph.fade);
  src.start();
  let on = false;

  return {
    update(state) {
      const next = Object.values(state).some((s) => s.stale && s.sounding);
      if (next === on) return;
      on = next;
      glideTo(ctx, gain.gain, on ? spec.maxGain : 0, (on ? spec.attackMs : spec.releaseMs) / 1000);
    },
  };
}
