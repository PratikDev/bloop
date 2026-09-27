// English captions for every sound event the engine emits (caption keys are
// listed in src/lib/audio-adapter). Params arrive untyped from the engine, so
// they are read through param helpers.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { formatRainRate, formatTemperature } from "../format";

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
  "caption.sweep.start": "Sweeping outward from Dhaka",
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
  "caption.earcon.whisper": (p: CaptionParams) => `Chime: measured by ${strParam(p, "source")}`,
  "caption.earcon.ping": "Ping: the extreme value in view",
  "caption.noBanglaVoice": "This device has no Bangla voice, so the value is shown but not spoken",
  "caption.noSpeech": "This browser can't speak; the value is shown instead",
};
