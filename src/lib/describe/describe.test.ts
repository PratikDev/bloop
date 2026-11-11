// The pattern rules on synthetic grids with known answers, the layers by detail level, and
// the digit-provenance test: no rendered description, English or Bangla, at any detail level, may hold
// a digit that no slot produced. The build runs this file (package.json "build"), so a typed number fails the build.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { placeText } from "@/components/Turntable/place-text";
import { ttFor } from "@/components/Turntable/i18n";
import { readUint16LE, readUint8 } from "@/lib/data/grid";
import type { RainField, SstField } from "@/lib/data/latest";
import { createGazetteer, type GeoFiles } from "@/lib/geo/gazetteer";
import { LANGS, type Lang } from "@/lib/i18n";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";
import { VERBOSITIES } from "@/components/AppState/access";
import { describeRecord, SLOT_CLOSE, SLOT_OPEN } from "./compose";
import { liveRainFrame, oceanFacts, rainFacts, type PlaceName, type RecordFacts } from "./facts";
import { around, extremes, peakBand, rainAround, warmestAround, type ValueGrid } from "./stats";

/** A 10° grid (36 × 18) whose value is f(lat, lon) at each cell centre. */
function grid(f: (lat: number, lon: number) => number | null): ValueGrid {
  const width = 36;
  const height = 18;
  const values = Array.from({ length: width * height }, (_, i) => f(85 - Math.floor(i / width) * 10, -175 + (i % width) * 10));
  return { width, height, value: (i) => values[i] };
}

describe("pattern rules (synthetic grids, known answers)", () => {
  test("extremes: the lowest and highest cells, at their centres; no data is skipped", () => {
    const g = grid((lat, lon) => (lat === 25 && lon === 85 ? 31 : lat === -65 && lon === 5 ? -1 : lat > 80 ? null : 20));
    const round = (e: { value: number; lat: number; lon: number }) => ({ value: e.value, lat: +e.lat.toFixed(6), lon: +e.lon.toFixed(6) });
    const found = extremes(g)!;
    expect({ min: round(found.min), max: round(found.max) }).toEqual({ min: { value: -1, lat: -65, lon: 5 }, max: { value: 31, lat: 25, lon: 85 } });
    expect(extremes(grid(() => null))).toBeNull();
  });

  test("warmest band: at the equator for a sea warmest there; around 45° N for one warmest there", () => {
    expect(Math.abs(peakBand(grid((lat) => 30 - Math.abs(lat) / 3))!)).toBeLessThanOrEqual(15);
    expect(peakBand(grid((lat) => 30 - Math.abs(lat - 45) / 3))).toBe(47.5);
  });

  test("3×3 around the needle: the north-east cell carries the rain → concentrated to the north-east", () => {
    const means = around(grid((lat, lon) => (lat === 35 && lon === 105 ? 8 : 0)), { lat: 25, lon: 95 });
    expect(means[8]).toBe(8);
    expect(rainAround(means)).toEqual({ kind: "toward", region: "northEast" });
  });

  test("rain: dry all round → even; the same rain everywhere → spread; rain only at the needle → right here", () => {
    const at = { lat: 25, lon: 95 };
    expect(rainAround(around(grid(() => 0), at))).toEqual({ kind: "even" });
    expect(rainAround(around(grid(() => 2), at))).toEqual({ kind: "spread" });
    expect(rainAround(around(grid((lat, lon) => (lat === 25 && lon === 95 ? 5 : 0)), at))).toEqual({ kind: "toward", region: "centre" });
    // Traces under the rule's lowest input (silent in the sound too) count as dry.
    expect(rainAround(around(grid(() => 0.05), at), 0.1)).toEqual({ kind: "even" });
  });

  test("ocean: within half a degree all round → even; warmer to the south-west → that way; all land → none", () => {
    const at = { lat: 25, lon: 95 };
    expect(warmestAround(around(grid(() => 28), at))).toEqual({ kind: "even" });
    expect(warmestAround(around(grid((lat, lon) => 28 - (lat - 25) / 10 - (lon - 95) / 10), at))).toEqual({ kind: "toward", region: "southWest" });
    expect(warmestAround(around(grid(() => null), at))).toEqual({ kind: "none" });
  });
});

const spot = { lat: 21.5, lon: 89.8, place: null };
const base: RecordFacts = {
  record: "ocean",
  timeUtc: "2026-11-04T00:00:00Z",
  here: spot,
  value: 29.83,
  frozen: false,
  min: { value: -1.8, lat: -70.1, lon: 10.2, place: null },
  max: { value: 32.4, lat: 10.3, lon: 120.9, place: "Celebes Sea, 210 km south of Zamboanga" },
  band: 2.5,
  local: { kind: "toward", region: "southWest" },
  change: null,
};

/** Every branch of the templates: values, no data, dry, frozen, each pattern and each change. */
const BRANCHES: RecordFacts[] = [
  base,
  { ...base, value: null, band: 42.5, local: { kind: "even" } },
  { ...base, local: { kind: "toward", region: "centre" }, min: null, max: null },
  { ...base, local: { kind: "none" }, band: null },
  ...[
    { value: 0, local: { kind: "even" } as const, change: { before: 0, after: 0, minutes: 30 } },
    { value: 3.2, local: { kind: "toward", region: "north" } as const, change: { before: 0, after: 3.2, minutes: 30 } },
    { value: 0, local: { kind: "spread" } as const, change: { before: 1.1, after: 0, minutes: 30 } },
    { value: 3.2, frozen: true, local: { kind: "toward", region: "centre" } as const, change: { before: 1.1, after: 3.2, minutes: 30 } },
    { value: 1.1, local: { kind: "spread" } as const, change: { before: 3.2, after: 1.1, minutes: 30 } },
    { value: 1.1, local: { kind: "spread" } as const, change: { before: 1.1, after: 1.1, minutes: 30 } },
    { value: null, local: { kind: "none" } as const, change: null, max: null },
    { value: 0, local: { kind: "even" } as const, change: null, max: null },
  ].map((r): RecordFacts => ({ ...base, record: "rain", min: null, band: null, max: { value: 48, lat: 22, lon: 91, place: null }, ...r })),
];

/** The text with every slot taken out: what the templates typed themselves. */
const typed = (s: string) => s.replace(new RegExp(`${SLOT_OPEN}[^${SLOT_CLOSE}]*${SLOT_CLOSE}`, "gu"), "");
const DIGITS = /[0-9০-৯]/u;

function expectNoTypedDigits(facts: RecordFacts) {
  for (const lang of LANGS)
    for (const v of VERBOSITIES) {
      const d = describeRecord(facts, v, lang, true);
      for (const line of [...d.data, d.meaning ?? ""]) expect({ lang, v, line: typed(line), digit: DIGITS.test(typed(line)) }).toMatchObject({ digit: false });
    }
}

describe("layers by detail level", () => {
  test("brief: what, where, when and the range; standard adds the pattern; detailed adds What this means, kept apart", () => {
    const brief = describeRecord(base, "brief", "en");
    expect(brief.data).toEqual([
      "Ocean surface temperature, 4 Nov 2026, 00:00 UTC.",
      "Here, 21.5 degrees north, 89.8 degrees east: 29.8 degrees Celsius.",
      "Across the map, the coldest is −1.8 degrees, near 70.1 degrees south, 10.2 degrees east. The warmest is 32.4 degrees, near Celebes Sea, 210 km south of Zamboanga.",
    ]);
    expect(brief.meaning).toBeNull();
    // Standard walks outward as the sweep does: the needle, the cells around it, then the whole map.
    const standard = describeRecord(base, "standard", "en");
    expect(standard.data).toEqual([...brief.data.slice(0, 2), "Around here, the water is warmer to the south-west.", brief.data[2], "The warmest water lies in a band near the equator."]);
    const detailed = describeRecord(base, "detailed", "en");
    expect(detailed.data).toEqual(standard.data);
    expect(detailed.meaning).toMatch(/^Warm sea water/u);
  });

  test("rain change since the previous frame, compared as said", () => {
    const rain = BRANCHES.filter((b) => b.record === "rain").map((f) => describeRecord(f, "standard", "en").data[3]); // what, here, the pattern around, then the change
    expect(rain.slice(0, 6)).toEqual([
      "The same as 30 minutes earlier.",
      "It started in the last 30 minutes.",
      "It stopped in the last 30 minutes.",
      "Heavier than 30 minutes earlier, when it was 1.1 millimetres an hour.",
      "Lighter than 30 minutes earlier, when it was 3.2 millimetres an hour.",
      "The same as 30 minutes earlier.",
    ]);
  });
});

describe("digit provenance: no digit outside a slot", () => {
  test("every template branch, English and Bangla, every detail level", () => {
    for (const facts of BRANCHES) expectNoTypedDigits(facts);
  });

  test("the shipped frames, at named places from the gazetteer (place lines are slots too)", () => {
    const root = join(import.meta.dir, "../../..", "public");
    const json = <T,>(rel: string) => JSON.parse(readFileSync(join(root, rel), "utf8")) as T;
    const buf = (rel: string) => {
      const b = readFileSync(join(root, rel));
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    };
    const sstMeta = json<SstMetadata>("data/latest/sst.json");
    const sst: SstField = { meta: sstMeta, codes: readUint16LE(buf("data/latest/sst.bin"), sstMeta.grid) };
    const rainMeta = json<RainMetadata>("data/latest/rain.json");
    const rain: RainField = { meta: rainMeta, codes: readUint16LE(buf("data/latest/rain.bin"), rainMeta.grid), phases: readUint8(buf("data/latest/rain_phase.bin"), rainMeta.grid) };
    const files: GeoFiles = {
      countries110m: json("geo/countries-110m.json"),
      countriesSouthAsia: json("geo/countries-10m-south-asia.json"),
      districts: json("geo/bd-districts.json"),
      marine: json("geo/marine.json"),
      places: json("geo/places.json"),
      story: json("geo/story-places.json"),
    };
    const gazetteer = createGazetteer(files);
    const namer = (lang: Lang): PlaceName => (at) => placeText(ttFor(lang), lang, gazetteer.whereAmI(at), true).line;
    const frame = liveRainFrame(rain);
    for (const at of [{ lat: 21.5, lon: 89.8 }, { lat: 22.36, lon: 91.78 }, { lat: 0, lon: 150 }, { lat: -60, lon: -40 }, { lat: 40, lon: -100 }])
      for (const lang of LANGS) {
        expectNoTypedDigits(oceanFacts(sst, at, namer(lang)));
        expectNoTypedDigits(rainFacts(frame, at, namer(lang), { before: 0.5, after: 1.4, minutes: 30 }));
      }
  });
});
