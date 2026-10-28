// English strings for the §15 additions (docs/data-integration-plan.md): truth checks read from
// JSON (book §13.2 wording), proof in unison, and the product credits. Every number is a
// parameter filled from a pipeline file. Honesty wording stays English (no Bangla drafts).

import { formatNumber } from "@/lib/audio/mapping";
import type { CaptionParams } from "@/lib/audio-adapter/types";
import { formatFixed, formatInteger } from "../format";
import { numParam } from "./captions";

const c2 = (v: number) => formatFixed(v, "en", 2);

export const dataEn = {
  "truth.ocean.sentence": (p: { median: number; n: number }) =>
    `Checked against NASA MUR SST: median error ${c2(p.median)} °C (${formatInteger(p.n, "en")} ocean points).`,
  "truth.ocean.frameOf": (p: { date: string }) => `On the latest EIC frame, against MUR for ${p.date}.`,
  "truth.anomaly.heading": "Ocean temperature vs normal",
  "truth.anomaly.error": "Couldn't load the anomaly check. Reload the page to try again.",
  "truth.anomaly.sentence": (p: { signPct: number; n: number; offset: number }) =>
    `SST anomaly checked against NOAA Coral Reef Watch: same sign at ${formatInteger(p.signPct, "en")}% of ` +
    `${formatInteger(p.n, "en")} points; reads ${c2(Math.abs(p.offset))} °C ${p.offset < 0 ? "cooler" : "warmer"} (different baselines).`,
  "truth.threeway.heading": "Three readings of the same points",
  "truth.threeway.sentence": (p: { n: number; gibs: number; frame: number; decodePct: number }) =>
    `At ${formatInteger(p.n, "en")} points, NASA's GIBS map layer and the MUR file differ by a median of ${c2(p.gibs)} °C; ` +
    `the EIC picture and the MUR file by ${c2(p.frame)} °C. ${formatInteger(p.decodePct, "en")}% of GIBS pixels decode to a value.`,
  "truth.unison.heading": "Proof in unison",
  "truth.unison.explain": (p: { median: number; semitones: number }) =>
    `Two tones: one from the EIC picture, one from NASA's file. Beats mean they disagree. ` +
    `${c2(p.median)} °C ≈ ${c2(p.semitones)} of a semitone.`,
  "truth.unison.play": "Hear the nearest checked point",
  "truth.unison.helix": (p: { beats: number }) =>
    `Proof helix: the frame's strand and the file's strand turn round each other ${formatFixed(p.beats, "en", 1)} times a second (they merge when the values agree).`,
  "truth.unison.pair": (p: { frame: number; file: number; beats: number }) =>
    `Frame ${c2(p.frame)} °C, NASA file ${c2(p.file)} °C: ${formatFixed(p.beats, "en", 1)} beats per second.`,
  "unison.say": (p: { km: number; place: string; frame: number; file: number }) =>
    `Nearest checked point, ${formatInteger(p.km, "en")} km away, ${p.place}. Frame ${c2(p.frame)} degrees, ` +
    `NASA file ${c2(p.file)} degrees. The frame tone first, then the file tone joins.`,
  "unison.loading": "The checked points are still loading.",
  "caption.unison": (p: CaptionParams) =>
    `Proof in unison: frame ${c2(numParam(p, "frame") ?? 0)} °C, NASA file ${c2(numParam(p, "file") ?? 0)} °C, ` +
    `${formatFixed(numParam(p, "beats") ?? 0, "en", 1)} beats a second`,
  // A2 "What you're hearing": from mapping.json and the frame's own check, never typed
  "hear.ocean": (p: { degreesPerSemitone: number; median: number | null }) =>
    `Higher = warmer · each semitone ≈ ${formatFixed(p.degreesPerSemitone, "en", 1)} °C` +
    (p.median === null ? "" : ` · MUR check ${c2(p.median)} °C`),
  "hear.rain": (p: { min: number; max: number; percent: number | null }) =>
    `More drops = heavier rain (${formatNumber(p.min)}–${formatNumber(p.max)} mm/h, logarithmic)` +
    (p.percent === null ? "" : ` · IMERG check ~${formatInteger(p.percent, "en")}%`),
  "credits.products": "Data in this app",
  "key.u.action": "Proof in unison: hear the nearest checked point (EIC frame tone, then NASA's file tone)",
};
