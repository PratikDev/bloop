// English captions for every sound event the engine emits (caption keys are
// listed in src/lib/audio-adapter). Params arrive untyped from the engine, so
// they are read through param helpers.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { formatMonth, formatRainRate, formatTemperature } from "../format";
import { PLACE_NAMES_EN } from "./places";

export const numParam = (p: CaptionParams, key: string): number | null =>
  typeof p[key] === "number" ? p[key] : null;
export const strParam = (p: CaptionParams, key: string): string => String(p[key] ?? "");

const TRACK_NAMES: Record<string, string> = { ocean: "ocean", rain: "rain", snow: "snow" };

export const captionsEn = {
  "caption.value": (p: CaptionParams) => {
    const v = numParam(p, "value") ?? 0;
    if (strParam(p, "track") === "ocean") return `Tone: ${formatTemperature(v, "en")} °C ocean`;
    if (strParam(p, "phase") === "dry") return "Quiet: dry here";
    const kind = strParam(p, "phase") === "frozen" ? "Bells: snow" : "Drops: rain";
    return `${kind}, ${formatRainRate(v, "en")} mm/h`;
  },
  "caption.nodata": (p: CaptionParams) =>
    `Tick, then silence: no ${TRACK_NAMES[strParam(p, "track")] ?? ""} data here`,
  "caption.sweep.start": `Sweeping outward from ${PLACE_NAMES_EN.sweepCenter}`,
  "caption.sweep.end": "Sweep finished",
  "caption.legend": (p: CaptionParams) => `Legend, ${TRACK_NAMES[strParam(p, "voice")] ?? ""}: ${strParam(p, "label")}`,
  "caption.legendUnavailable": "That legend comes with Then vs Now",
  "caption.warmup.start": "Warm-up: set a comfortable volume while the reference sounds play",
  "caption.warmup.end": "Warm-up finished",
  "caption.motif": "The Jukebox motif: four notes, one per band of ocean from south to north",
  "caption.opening.closeEyes": "Close your eyes.",
  "caption.opening.openEyes": "Now open your eyes.",
  "caption.stopped": "All sound stopped",
  "caption.earcon.nodata": "Tick: no data here",
  "caption.earcon.whisper": (p: CaptionParams) => `Chime: ${strParam(p, "source")}`,
  "caption.earcon.ping": "Ping: the extreme value in view",
  // Then vs Now: the part's caption is shown exactly as the JSON gives it.
  "caption.thenNow.caption": (p: CaptionParams) => strParam(p, "text"),
  "caption.thenNow.window": (p: CaptionParams) => `Playing ${strParam(p, "label")}`,
  "caption.thenNow.end": "Then vs Now finished",
  "caption.water.gap": (p: CaptionParams) => {
    const from = formatMonth(strParam(p, "from"), "en");
    const to = formatMonth(strParam(p, "to"), "en");
    return from === to ? `Silence: no satellite measurement for ${from}` : `Silence: no satellite measurements, ${from} to ${to}`;
  },
  "caption.water.windowStart": (p: CaptionParams) => `Comparison window starts: ${formatMonth(strParam(p, "month"), "en")}`,
  "caption.water.windowEnd": (p: CaptionParams) => `Comparison window ends: ${formatMonth(strParam(p, "month"), "en")}`,
  "caption.compare.side": (p: CaptionParams) => `Now playing: ${strParam(p, "label")}`,
  "caption.compare.useHeadphones": (p: CaptionParams) =>
    `${strParam(p, "a")} in your left ear, ${strParam(p, "b")} in your right. Headphones help.`,
  // Storm time-lapse (L2 Phase 6). Params proposed in contract-proposals B8.
  "caption.timelapse.start": (p: CaptionParams) =>
    `Storm time-lapse: ${numParam(p, "count") ?? ""} frames; the cursor follows the heaviest rain nearby`,
  "caption.timelapse.peak": (p: CaptionParams) =>
    `Heaviest ${strParam(p, "phase") === "frozen" ? "snow" : "rain"} in this time-lapse: ${formatRainRate(numParam(p, "value") ?? 0, "en")} mm/h`,
  "caption.timelapse.end": "Time-lapse finished",
  "caption.noBanglaVoice": "This device has no Bangla voice, so the value is shown but not spoken",
  "caption.noSpeech": "This browser can't speak; the value is shown instead",
};
