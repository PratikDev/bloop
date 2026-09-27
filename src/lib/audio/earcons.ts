// Earcons: short signal sounds on the earcon bus (never silenced by solo or
// track mode), each ≤ 300 ms. Levels and envelopes come from mapping.json.

import { emitCaption } from "./captions";
import { getCtx, getGraph, peekEngine } from "./context";
import { panFor, voiceSpec } from "./mapping";
import { blip } from "./params";
import { track } from "./sources";
import type { CaptionParams, EarconId } from "./types";

const TICK_HZ = 1800;
const WHISPER_HZ = [1600, 2100]; // two soft notes, rising
const WHISPER_NOTE_SEC = 0.15;
const PING_HZ = 2500;

/** One sine blip on the earcon bus, shaped by an earcon's mapping.json envelope. */
function tone(id: EarconId, freq: number, time: number, lon: number) {
  const ctx = getCtx();
  const { attackMs, releaseMs, maxGain } = voiceSpec(id).sound;
  const osc = track(new OscillatorNode(ctx, { type: "sine", frequency: freq }));
  const env = new GainNode(ctx, { gain: 0 });
  const pan = new StereoPannerNode(ctx, { pan: panFor(lon) });
  osc.connect(env).connect(pan).connect(getGraph().earcon);
  blip(env.gain, time, maxGain, attackMs / 1000, releaseMs / 1000);
  osc.start(time);
  osc.stop(time + (attackMs + releaseMs * 2) / 1000);
}

const SOUNDS: Record<EarconId, (time: number, lon: number) => void> = {
  // soft tick when entering no data (AUDIO_RESEARCH C2, a design choice)
  nodata: (time, lon) => tone("nodata", TICK_HZ, time, lon),
  // after a spoken value: which satellite / dataset measured it (C7)
  whisper: (time, lon) => WHISPER_HZ.forEach((hz, i) => tone("whisper", hz, time + i * WHISPER_NOTE_SEC, lon)),
  // the extreme value in view (B5)
  ping: (time, lon) => tone("ping", PING_HZ, time, lon),
};

/** Plays an earcon now (silent before Start). Internal: no caption. */
export function playEarconAt(id: EarconId, time: number, lon = 0) {
  if (!peekEngine()) return;
  SOUNDS[id](time, lon);
}

/** Public: plays an earcon and emits `caption.earcon.<id>` with the caller's params (e.g. whisper `{ source }`). */
export function playEarcon(id: EarconId, opts: { lon?: number; params?: CaptionParams } = {}) {
  if (!peekEngine()) return;
  playEarconAt(id, getCtx().currentTime, opts.lon ?? 0);
  emitCaption(`caption.earcon.${id}`, opts.params ?? {});
}
