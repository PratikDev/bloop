import type { TrackMode } from "@/lib/audio-adapter/types";
import { loadSequenceFrame, rainChangeAt, type LatLon, type LiveFields } from "@/lib/data";
import { liveRainFrame, oceanFacts, rainFacts, sequenceRainFrame, type DescribedRecord, type PlaceName, type RainFrame, type RecordFacts } from "@/lib/describe/facts";
import type { Lang } from "@/lib/i18n";
import { loadGeoSoon, placeNamers } from "./place-namer";

export interface DescribeInput {
  fields: LiveFields;
  at: LatLon;
  track: TrackMode;
  heldFrame: number | null;
}

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
