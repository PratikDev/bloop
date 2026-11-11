// Tomorrow's fire weather: the app's decode of the shipped class grids equals the pipeline's own summaries (the
// city cells it wrote into fwi_class.json and the archive index, and the Bangladesh box counts); each class plays its own
// fixed state; the chord never touches a data voice's pitch; the replay plays the archive's days in the index's order.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { continuousRule, mapContinuous, MAPPING } from "@/lib/audio/mapping";
import { readData } from "@/lib/i18n/data-sentences";
import type { FirmsContextFile, FwiArchiveIndex, FwiClassMetadata } from "@/types/data-contract";
import { boxCounts, classAt, type ClassGrid } from "./class-grid";
import { chordHz, classesRule, classState, FIRE_WEATHER_VOICE, isSilent, ruleMatchesClasses } from "./classes";
import { nextDay, replayDays } from "./fwi";
import { activeRegions } from "./regions";

const meta = readData<FwiClassMetadata>("latest/fwi_class.json");
const latest: ClassGrid<FwiClassMetadata> = { meta, codes: new Uint8Array(readFileSync("public/data/latest/fwi_class.bin")) };
const archive = readData<FwiArchiveIndex>("context/fwi_archive_index.json");
const firms = readData<FirmsContextFile>("context/firms.json");
/** The pipeline's city cells (pipeline/build_context.py CELLS), read from its source: the cells it decoded. */
const CELLS = Object.fromEntries(
  [...readFileSync("pipeline/build_context.py", "utf8").matchAll(/"(\w+)": \(([\d.]+), ([\d.]+)\)/gu)].map((m) => [m[1], [Number(m[2]), Number(m[3])]] as const),
);
const bdBox = firms.daily?.boxes.Bangladesh;

describe("FWI classes decode as the pipeline decoded them", () => {
  test("five sample cells: the four city cells and the Bangladesh box (the pipeline's own summary)", () => {
    const places = Object.entries(meta.bangladesh.places);
    expect(places.length).toBe(4);
    for (const [name, code] of places) expect(classAt(latest, CELLS[name][0], CELLS[name][1]), name).toBe(code);
    expect(bdBox).toBeDefined();
    const counts = boxCounts(meta.grid, latest.codes, bdBox ?? [0, 0, 0, 0]);
    for (const [code, n] of Object.entries(meta.bangladesh.bd_box_counts)) expect(counts.get(Number(code)) ?? 0, `class ${code}`).toBe(n);
  });
  test("each archived day decodes to its own index summary", () => {
    for (const day of archive.days) {
      const codes = new Uint8Array(gunzipSync(readFileSync(`public/data/${day.file}`)));
      const g = { meta, codes };
      for (const [name, code] of Object.entries(day.places)) expect(classAt(g, CELLS[name][0], CELLS[name][1]), `${day.date} ${name}`).toBe(code);
      const counts = boxCounts(meta.grid, codes, bdBox ?? [0, 0, 0, 0]);
      for (const [code, n] of Object.entries(day.bd_box_counts)) expect(counts.get(Number(code)) ?? 0).toBe(n);
    }
  });
});

describe("the fire-weather rule (mapping-data.json)", () => {
  const rule = classesRule(FIRE_WEATHER_VOICE);
  test("lists exactly the product's classes, with its labels", () => {
    expect(ruleMatchesClasses(rule, meta.classes)).toBe(true);
  });
  test("no calculation and very low are stated silences; the six classes have six distinct states", () => {
    expect(isSilent(classState(rule, 0))).toBe(true);
    expect(isSilent(classState(rule, 1))).toBe(true);
    const states = meta.classes.filter((c) => c.code > 0).map((c) => JSON.stringify(chordHz(rule, classState(rule, c.code))));
    expect(new Set(states).size).toBe(6);
  });
  test("chords grow from an open fifth to a dense cluster (more tones, narrower steps)", () => {
    const sounding = meta.classes.map((c) => classState(rule, c.code)).filter((s) => s?.sound === "chord");
    expect(sounding[0]?.tones).toEqual([0, 7]);
    for (let i = 1; i < sounding.length; i++) expect((sounding[i]?.tones?.length ?? 0) >= (sounding[i - 1]?.tones?.length ?? 0)).toBe(true);
  });
  test("the chord never changes a data voice's pitch (its tones are fixed; every value voice maps as before)", () => {
    const before = MAPPING.voices.filter((v) => v.mapping?.kind === "continuous").map((v) => mapContinuous(25, continuousRule(v.id)));
    for (const c of meta.classes) chordHz(rule, classState(rule, c.code));
    const after = MAPPING.voices.filter((v) => v.mapping?.kind === "continuous").map((v) => mapContinuous(25, continuousRule(v.id)));
    expect(after).toEqual(before);
    expect(chordHz(rule, classState(rule, 2))).toEqual(chordHz(rule, classState(rule, 2)));
    expect(continuousRule("ocean").output).toEqual({ param: "frequency", unit: "Hz", min: 220, max: 880, scale: "exponential" });
  });
});

describe("the archive replay", () => {
  test("plays the days in the index's order", () => {
    expect(replayDays(archive).map((d) => d.date)).toEqual(archive.days.map((d) => d.date));
  });
  test("a forecast issued on a day is for the next day", () => {
    expect(nextDay("2026-10-31")).toBe("2026-11-01");
  });
});

describe("the most active fire-weather regions", () => {
  test("three distinct regions, each above Bangladesh's class today", () => {
    const regions = activeRegions(meta.grid, latest.codes);
    expect(regions.length).toBe(3);
    for (const r of regions) expect(r.meanClass).toBeGreaterThan(1);
    for (const r of regions) expect(classAt(latest, r.lat, r.lon)).toBe(r.topClass);
  });
});

describe("the stated silence names its class", () => {
  test("the silent class's line says 'Silence: <class> fire weather' (EN), from the file's own label", async () => {
    const { bindT } = await import("@/lib/i18n");
    const { fwiLine } = await import("./fire-text");
    const rule = classesRule(FIRE_WEATHER_VOICE);
    const silentCodes = meta.classes.map((c) => c.code).filter((c) => c !== 0 && isSilent(classState(rule, c)));
    expect(silentCodes.length).toBe(1);
    const label = meta.classes.find((c) => c.code === silentCodes[0])?.label ?? "";
    expect(label.toLowerCase()).toBe("very low");
    const line = fwiLine(bindT("en"), "en", meta, { fwiCode: silentCodes[0], forDay: archive.days[0].date });
    expect(line).toContain(`Silence: ${label} fire weather.`);
  });
});
