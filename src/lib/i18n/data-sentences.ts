// Every data-file sentence the UI shows through t("data.text"), read from the shipped files (Node: tests and
// docs/i18n/TO_TRANSLATE.md only). Keep in step with the components that call t("data.text").

import { readFileSync } from "node:fs";
import { APP_VOICES, MAPPING } from "@/lib/audio/mapping";
import type { CitiesThenNowFile, DhakaThenNowDemo, FirmsContextFile, GlobalManifest, GlobalPlacesFile, GraceContextFile, NdviContextFile } from "@/types/data-contract";
import { translateData } from "./bn/data";

/** A shipped data file (public/data/<path>). */
export const readData = <T,>(path: string): T => JSON.parse(readFileSync(`public/data/${path}`, "utf8")) as T;

/** Every data-file sentence the UI shows (keep in step with the components that call t("data.text")). */
export function shownSentences(): string[] {
  const demo = readData<DhakaThenNowDemo>("demo/dhaka_then_now.json");
  const cities = readData<CitiesThenNowFile>("demo/cities_then_now.json");
  const grace = readData<GraceContextFile>("context/grace.json");
  const places = readData<GlobalPlacesFile>("global/places.json");
  const layers = ["heat", "rain", "water"].map((l) => readData<{ caveat?: string; gap_note?: string }>(`global/${l}.json`));
  const rain = readData<{ frame_time_meaning: string; source_dataset: string }>("latest/rain.json");
  const globe = readData<{ title: string; disclosure: string }>("context/globe_duet.json");
  return [
    demo.story,
    demo.honesty_beat,
    ...demo.not_claimed,
    demo.heat.caption,
    demo.rain.caption,
    demo.rain.gpcc_end_note,
    demo.rain.gpcp_newer.label,
    demo.water.caption,
    ...cities.cities.flatMap((c) => [c.heat.caption, c.rain.caption, c.rain.gpcc_end_note, c.rain.gpcp_newer.label]),
    grace.gap_note,
    readData<FirmsContextFile>("context/firms.json").rule,
    readData<NdviContextFile>("context/ndvi.json").caveat,
    readData<{ caveat?: string }>("context/gpcp_bd.json").caveat ?? "",
    readData<GlobalManifest>("global/manifest.json").disclosure,
    ...places.places.map((p) => p.name),
    ...places.places.flatMap((p) => (p.water_region ? [p.water_region.label] : [])),
    ...layers.flatMap((l) => [l.caveat, l.gap_note].filter((s) => s !== undefined)),
    rain.frame_time_meaning,
    globe.title,
    globe.disclosure,
    ...MAPPING.global.rules,
    ...APP_VOICES.flatMap((v) => [v.silence, v.sound.timbre, v.note ?? "", ...v.legend.map((l) => l.label)]),
  ].filter((s) => s !== "");
}

/** The shown sentences Bangla doesn't translate yet (or translates with Latin digits). */
export function untranslatedSentences(): string[] {
  return [...new Set(shownSentences())].filter((s) => translateData(s) === s || /[0-9]/u.test(translateData(s)));
}
