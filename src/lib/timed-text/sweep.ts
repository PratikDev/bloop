// PURE: the sweep's timed text (accessibility core, step 7). One metadata cue per point, one chapter per ring, and
// DCMP-style captions for what the sound does: where it begins, the highest and lowest tone, the densest drops, the
// first silence on each ring, and the end. Point i starts at i × stepSec, as both engines schedule it.
import type { SweepPoint, TrackMode } from "@/lib/audio/types";
import { evenSteps } from "@/lib/audio/players/steps";
import { formatInteger } from "@/lib/i18n";
import { chain } from "./vtt";
import { metadataCue, placeOf, rainNote, rainSlot, tempSlot, UNIT, type TimedTracks, type TrackText } from "./tracks";

export interface SweepRun {
  points: SweepPoint[];
  ring: number[];
  ringDeg: number[];
  center: { lat: number; lon: number };
  stepSec: number;
  track: TrackMode;
}

/** The index of the largest (or, with `lowest`, smallest) non-null value, or -1. */
export function extremeIndex(values: readonly (number | null)[], lowest = false): number {
  let best = -1;
  values.forEach((v, i) => {
    if (v === null) return;
    const b = best === -1 ? null : values[best];
    if (b === null || (lowest ? v < b : v > b)) best = i;
  });
  return best;
}

export function sweepTracks(run: SweepRun, x: TrackText): TimedTracks {
  const { points, ring, ringDeg, stepSec, track } = run;
  const at = evenSteps(points.length, stepSec);
  const end = points.length * stepSec;
  const ocean = track !== "rain";
  const rain = track !== "ocean";

  const metadata = points.map((p, i) => {
    const note = ocean && p.valueC === null ? x.t("tt.note.land") : rainNote(x, p);
    return metadataCue(at[i], at[i] + stepSec, { time: null, lat: p.lat, lon: p.lon, place: placeOf(x, p), value: ocean ? p.valueC : p.mmPerHour, unit: ocean ? UNIT.ocean : UNIT.rain, note });
  });

  const firsts = ringDeg.map((deg, k) => ({ deg, k, i: ring.indexOf(k) })).filter((r) => r.i !== -1);
  const center = placeOf(x, run.center);
  const total = formatInteger(firsts.length, x.lang);
  const chapters = chain(
    firsts.map((r) => ({ start: at[r.i], text: x.t("tt.chapter.ring", { n: formatInteger(r.k + 1, x.lang), total, deg: formatInteger(r.deg, x.lang), place: center }) })),
    end,
  );

  const caps: { start: number; text: string }[] = [{ start: 0, text: x.t("tt.cap.sweepBegin", { place: center }) }];
  if (ocean) {
    const temps = points.map((p) => p.valueC);
    const hi = extremeIndex(temps);
    const lo = extremeIndex(temps, true);
    if (hi !== -1) caps.push({ start: at[hi], text: x.t("tt.cap.warmest", { value: tempSlot(x, temps[hi] as number), place: placeOf(x, points[hi]) }) });
    if (lo !== -1 && lo !== hi) caps.push({ start: at[lo], text: x.t("tt.cap.coolest", { value: tempSlot(x, temps[lo] as number), place: placeOf(x, points[lo]) }) });
    // The soft tick: the first step onto land (or a gap) on each ring.
    for (const r of firsts) {
      const i = points.findIndex((p, j) => ring[j] === r.k && j > 0 && p.valueC === null && points[j - 1].valueC !== null);
      if (i !== -1) caps.push({ start: at[i], text: x.t("tt.cap.land", { place: placeOf(x, points[i]) }) });
    }
  }
  if (rain) {
    const wet = points.map((p) => (p.phase === "nodata" || !p.mmPerHour ? null : p.mmPerHour));
    const w = extremeIndex(wet);
    if (w !== -1) caps.push({ start: at[w], text: x.t(points[w].phase === "frozen" ? "tt.cap.snowiest" : "tt.cap.wettest", { value: rainSlot(x, wet[w] as number), place: placeOf(x, points[w]) }) });
  }
  caps.sort((a, b) => a.start - b.start);
  caps.push({ start: end, text: x.t("tt.cap.sweepEnd") });
  return { metadata, chapters, captions: chain(caps, end + stepSec) };
}
