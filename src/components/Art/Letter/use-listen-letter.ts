"use client";

import { useLoaded } from "@/hooks/use-loaded";
import type { LetterInput, LetterReading } from "@/lib/art/letter/letter";
import { datasetLink } from "@/lib/provenance/live";
import { voiceSpec } from "@/lib/audio/mapping";
import type { LatLon, LiveFields } from "@/lib/data";
import { loadFreshness } from "@/lib/data/freshness";
import type { BoundT, Lang } from "@/lib/i18n";
import { readAt } from "@/lib/reading";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { useAppState, useT } from "../../AppState/use-app-state";
import { loadGeoSoon, placeNamers } from "../../Describe/place-namer";
import { useLiveData } from "../../LiveData/use-live-data";

/** The letter for a place on the live frames: the ocean value (or rain, when only rain plays), through readAt (the same
 *  reading the sound plays), with the frame's date, dataset and validation line. */
function liveLetter(t: BoundT, fields: LiveFields, at: LatLon, track: "ocean" | "rain" | "both", place: string | null, link: string | null): LetterInput {
  const r = readAt(fields, at);
  const name = place ?? t("place.latlon", at);
  if (track !== "rain" && r.ocean.valueC !== null) {
    const meta = fields.sst.meta;
    const reading: LetterReading = { kind: "ocean", valueC: r.ocean.valueC, medianC: oceanTruth(meta)?.median ?? null };
    return { place: name, date: meta.frame_time_utc.slice(0, 10), reading, source: meta.source_dataset, link };
  }
  const rain = fields.rain;
  if (rain && r.rain.phase !== "nodata" && r.rain.mmPerHour !== null) {
    const reading: LetterReading = r.rain.phase === "dry" ? { kind: "dry" } : { kind: "rain", mmPerHour: r.rain.mmPerHour, percent: rainTruth(rain.meta).percent };
    return { place: name, date: rain.meta.frame_time_utc.slice(0, 10), reading, source: rain.meta.source_dataset, link };
  }
  return { place: name, date: fields.sst.meta.frame_time_utc.slice(0, 10), reading: { kind: "none" }, source: fields.sst.meta.source_dataset, link };
}

/** The letter for the needle on Listen, or null while the frames load. */
export function useListenLetter(at?: LatLon): { letter: LetterInput; lang: Lang } | null {
  const { state } = useAppState();
  const t = useT();
  const { fields } = useLiveData();
  const { value: geo } = useLoaded(loadGeoSoon);
  const { value: freshness } = useLoaded(loadFreshness);
  if (!fields) return null;
  const where = at ?? state.cursor;
  const product = state.track === "rain" ? voiceSpec("rain").source.product : voiceSpec("ocean").source.product;
  const place = placeNamers(geo ?? null, state.lang).name(where);
  return { letter: liveLetter(t, fields, where, state.track, place, datasetLink(freshness ?? null, product)), lang: state.lang };
}
