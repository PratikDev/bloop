// What a description of the needle needs, gathered once (accessibility core, step 3): the frame on screen (live, or a
// time-lapse frame held with PageUp/PageDown), the change since the frame before, and place names from the gazetteer.
// D and the Description panel both use it, so they never disagree.
import type { TrackMode } from "@/lib/audio-adapter/types";
import { loadSequenceFrame, rainChangeAt, type LatLon, type LiveFields } from "@/lib/data";
import { liveRainFrame, oceanFacts, rainFacts, sequenceRainFrame, type DescribedRecord, type PlaceName, type RainFrame, type RecordFacts } from "@/lib/describe/facts";
import type { Lang } from "@/lib/i18n";
import { loadGeoSoon, placeNamers } from "./place-namer";

export interface DescribeInput {
  fields: LiveFields;
  at: LatLon;
  /** The track on screen (a held frame shows rain). */
  track: TrackMode;
  /** A time-lapse frame held on the map (its position in the sequence), or null for the live frames. */
  heldFrame: number | null;
}

/** The facts for each record on screen, in a language (place names follow it). */
export type FactsFor = (lang: Lang) => RecordFacts[];

async function rainFrameFor(input: DescribeInput): Promise<RainFrame | null> {
  if (input.heldFrame === null) return input.fields.rain ? liveRainFrame(input.fields.rain) : null;
  const held = await loadSequenceFrame(input.heldFrame).catch(() => null);
  return held ? sequenceRainFrame(held.frame, { width: held.index.grid.width, height: held.index.grid.height }) : null;
}

export async function describeNow(input: DescribeInput): Promise<FactsFor> {
  const { fields, at, track } = input;
  const records: readonly DescribedRecord[] = input.heldFrame !== null ? ["rain"] : track === "both" ? ["ocean", "rain"] : [track];
  const [geo, rain] = await Promise.all([loadGeoSoon(), records.includes("rain") ? rainFrameFor(input) : null]);
  const change = rain ? await rainChangeAt(rain.timeUtc, at.lat, at.lon).catch(() => null) : null;
  const namer = (lang: Lang): PlaceName => placeNamers(geo, lang).name;
  return (lang) =>
    records.flatMap((r): RecordFacts[] => {
      if (r === "ocean") return [oceanFacts(fields.sst, at, namer(lang))];
      return rain ? [rainFacts(rain, at, namer(lang), change)] : [];
    });
}
