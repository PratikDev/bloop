// Earcons: short signal sounds on the earcon bus (never silenced by solo or
// track mode). Phase 2 has the no-data tick; the whisper chime and extreme
// ping arrive in Phase 3.

import { getCtx, getGraph } from "./context";
import { panFor, voiceSpec } from "./mapping";
import { blip } from "./params";
import { track } from "./sources";

const TICK_HZ = 1800;

/**
 * The soft no-data tick (AUDIO_RESEARCH C2, a design choice): played once when
 * the cursor enters an area with no data, so silence isn't mistaken for a freeze.
 */
export function playNoDataTick(time: number, lon: number) {
  const ctx = getCtx();
  const { attackMs, releaseMs, maxGain } = voiceSpec("nodata").sound;
  const osc = track(new OscillatorNode(ctx, { type: "sine", frequency: TICK_HZ }));
  const env = new GainNode(ctx, { gain: 0 });
  const pan = new StereoPannerNode(ctx, { pan: panFor(lon) });
  osc.connect(env).connect(pan).connect(getGraph().earcon);
  blip(env.gain, time, maxGain, attackMs / 1000, releaseMs / 1000);
  osc.start(time);
  osc.stop(time + (attackMs + releaseMs * 2) / 1000);
}
