import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { MAPPING, ruleParts } from "@/lib/audio/mapping";
import type { CitiesThenNowFile, DhakaThenNowDemo, FirmsContextFile, GlobalManifest, GlobalPlacesFile, GraceContextFile, NdviContextFile } from "@/types/data-contract";
import { translateData } from "./data";
import { ruleTextBn } from "./rules";

const read = <T,>(path: string): T => JSON.parse(readFileSync(`public/data/${path}`, "utf8")) as T;

/** Every data-file sentence the UI shows (keep in step with the components that call t("data.text")). */
function shownSentences(): string[] {
  const demo = read<DhakaThenNowDemo>("demo/dhaka_then_now.json");
  const cities = read<CitiesThenNowFile>("demo/cities_then_now.json");
  const grace = read<GraceContextFile>("context/grace.json");
  const places = read<GlobalPlacesFile>("global/places.json");
  const layers = ["heat", "rain", "water"].map((l) => read<{ caveat?: string; gap_note?: string }>(`global/${l}.json`));
  const rain = read<{ frame_time_meaning: string; source_dataset: string }>("latest/rain.json");
  const globe = read<{ title: string; disclosure: string }>("context/globe_duet.json");
  return [
    demo.story,
    demo.honesty_beat,
    ...demo.not_claimed,
    demo.heat.caption,
    demo.rain.caption,
    demo.water.caption,
    ...cities.cities.flatMap((c) => [c.heat.caption, c.rain.caption]),
    grace.gap_note,
    read<FirmsContextFile>("context/firms.json").rule,
    read<NdviContextFile>("context/ndvi.json").caveat,
    read<{ caveat?: string }>("context/gpcp_bd.json").caveat ?? "",
    read<GlobalManifest>("global/manifest.json").disclosure,
    ...places.places.map((p) => p.name),
    ...places.places.flatMap((p) => (p.water_region ? [p.water_region.label] : [])),
    ...layers.flatMap((l) => [l.caveat, l.gap_note].filter((s) => s !== undefined)),
    rain.frame_time_meaning,
    globe.title,
    globe.disclosure,
    ...MAPPING.global.rules,
    ...MAPPING.voices.flatMap((v) => [v.silence, v.sound.timbre, v.note ?? "", ...v.legend.map((l) => l.label)]),
  ].filter((s) => s !== "");
}

describe("translateData", () => {
  test("translates every data-file sentence the UI shows, with Bengali digits only", () => {
    const missed = shownSentences().filter((s) => translateData(s) === s || /[0-9]/.test(translateData(s)));
    expect(missed).toEqual([]);
  });

  test("translates L1's note after a dataset name, keeping the name", () => {
    const { source_dataset } = read<{ source_dataset: string }>("latest/rain.json");
    const [name] = source_dataset.split(":");
    expect(translateData(source_dataset)).toStartWith(`${name}: নতুন`);
  });

  test("takes the numbers from the source sentence", () => {
    expect(translateData("Single 250 m pixels.")).toBe("একক ২৫০ মিটার পিক্সেল।");
    expect(translateData("−1 °C")).toBe("−১ °সে");
    expect(translateData("3° GRACE cell 3°S–0°N, 36°E–39°E")).toBe("৩° GRACE সেল ৩° দক্ষিণ–০° উত্তর, ৩৬° পূর্ব–৩৯° পূর্ব");
  });

  test("leaves a sentence it doesn't know in English", () => {
    expect(translateData("A sentence L1 wrote later.")).toBe("A sentence L1 wrote later.");
    expect(translateData("Single 250 m pixels, newly reworded.")).toBe("Single 250 m pixels, newly reworded.");
  });
});

describe("ruleTextBn", () => {
  test("builds a Bangla rule for every voice, with no Latin digits", () => {
    for (const voice of MAPPING.voices) {
      const text = ruleTextBn(voice);
      expect(text.length).toBeGreaterThan(0);
      if (ruleParts(voice)) expect(text).not.toMatch(/[0-9]/);
    }
  });
});
