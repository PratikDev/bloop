// Earth Orchestra: every playable record has a category (or is listed as unplaced, never guessed), the table matches
// the registry, and every family is timbre only: harmonic spectra on one pitch, fixed filters and textures.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EARTH_CATEGORIES } from "@/lib/audio/layers/types";
import { APP_RECORD_IDS, APP_RECORDS, METHOD_APPLIED_TO } from "@/lib/earth/records";
import { en } from "@/lib/i18n";
import { classifyRecord, matchCategory, withMethods } from "./classify";
import { earconHz, EARCON_SEC, FAMILIES, familyFor, noteAttack } from "./families";
import { categoryOfVoice, getCategory, orchestra, UNCLASSIFIED } from "./index";
import table from "./categories.json";

const DATA = join(process.cwd(), "public", "data");
const json = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
type Row = { record: string; title: string };
type Manifest = { title?: string; layers: { label?: string }[] };

function registry(folder: "official" | "related") {
  return json<{ records: Row[] }>(join(DATA, folder, "index.json")).records.map((r) => {
    const m = json<Manifest>(join(DATA, folder, r.record, "manifest.json"));
    return { id: r.record, title: `${r.title} ${m.title ?? ""}`, layers: m.layers.map((l) => l.label ?? "") };
  });
}

describe("Earth Orchestra categories", () => {
  // DATA's records built from the shipped products join the registry with their own titles.
  const dataRecords = APP_RECORD_IDS.map((id) => ({ id, title: en[APP_RECORDS[id].titleKey], layers: [] as string[] }));
  const records = [...registry("official"), ...registry("related"), ...dataRecords];

  test("every playable record (Official, Related, Listen, Then vs Now) has a category or is listed as unplaced", () => {
    const ids = [...records.map((r) => r.id), "ocean", "rain", "snow", "heat", "monsoon", "water"];
    const unplaced = new Set(UNCLASSIFIED.map((u) => u.id));
    for (const id of ids) expect([id, getCategory(id) !== null || unplaced.has(id)]).toEqual([id, true]);
  });

  test("the committed table matches the registry (re-run scripts/orchestra-categories.ts after adding records)", () => {
    const voices = ["ocean", "rain", "snow", "heat", "monsoon", "water"].map((id) => ({ id, category: getCategory(id), from: "title" as const, matched: "" }));
    const classified = withMethods([...voices.flatMap((v) => (v.category === null ? [] : [{ ...v, category: v.category }])), ...records.map(classifyRecord)], METHOD_APPLIED_TO);
    for (const r of records) expect([r.id, classified.find((c) => c.id === r.id)?.category ?? null]).toEqual([r.id, getCategory(r.id)]);
  });

  test("the unplaced records are the mixed ones, each with a reason", () => {
    expect(UNCLASSIFIED.map((u) => u.id).sort()).toEqual(["patterns_eic", "rel_gibs"]);
    for (const u of UNCLASSIFIED) expect(u.reason.length).toBeGreaterThan(0);
  });

  test("the Listen and Then vs Now voices sit where the statement puts them", () => {
    expect([getCategory("ocean"), getCategory("rain"), getCategory("snow")]).toEqual(["ocean", "air", "air"]);
    expect([getCategory("heat"), getCategory("monsoon"), getCategory("water")]).toEqual(["air", "air", "ice"]);
    expect([getCategory("currents_3912"), getCategory("lights_5313"), getCategory("forest_4950"), getCategory("aerosols_5669")]).toEqual(["ocean", "people", "land", "fire"]);
    expect(categoryOfVoice("patternScan")).toBeNull();
  });

  test("rules: specific before general, never a guess for unknown words", () => {
    expect(matchCategory("What happened to the Ozone Layer")?.category).toBe("air");
    expect(matchCategory("Simulation of Surface Ozone")?.category).toBe("fire");
    expect(matchCategory("OCO-2 and the Keeling Curve (CO₂)")?.category).toBe("people");
    expect(matchCategory("Data Sonification: Caldwell 73")).toBeNull();
    expect(Object.keys(table.records).length).toBeGreaterThan(60);
  });
});

describe("Earth Orchestra families", () => {
  test("every family's note opens before it ends, however short (a song note is 0.22 s)", () => {
    for (const f of Object.values(FAMILIES))
      for (const d of [0.05, 0.22, 0.4, 2]) {
        expect(noteAttack(f, d)).toBeLessThan(d);
        expect(noteAttack(f, d)).toBeLessThanOrEqual(f.attack);
      }
    expect(noteAttack(FAMILIES.plain, 1)).toBe(FAMILIES.plain.attack);
  });

  test("one family per Earth system, plus plain tones", () => {
    expect(Object.keys(FAMILIES).sort()).toEqual([...EARTH_CATEGORIES, "plain"].sort());
    expect(familyFor("ocean", false).timbre).toBe("plain");
    expect(familyFor(null, true).timbre).toBe("plain");
    expect(familyFor("ice", true).timbre).toBe("ice");
  });

  test("timbre only: every layer has a fundamental (the note's own pitch) and only harmonic partials", () => {
    for (const f of Object.values(FAMILIES)) {
      expect(f.live[0]).toBe(1);
      for (const l of f.layers) expect(l.partials[0]).toBeGreaterThan(0);
      if (f.texture) expect(f.texture.hz).toBeGreaterThan(0); // a fixed band, never a data value
    }
  });

  test("the earcon is 0.4 s of fixed notes (no data value can reach it)", () => {
    expect(EARCON_SEC).toBe(0.4);
    for (const c of EARTH_CATEGORIES) for (const hz of earconHz(FAMILIES[c])) expect(hz).toBeGreaterThan(400);
  });

  test("OrchestraApi: getCategory and orchestraVoice", () => {
    expect(orchestra.getCategory("river_4960")).toBe("air");
    for (const c of EARTH_CATEGORIES) expect(orchestra.orchestraVoice(c).category).toBe(c);
  });
});

describe("DATA's records in Earth Orchestra", () => {
  test("fires, landslides, night lights and NASA's radar method get their families through getCategory", () => {
    expect([getCategory("fires_fwi"), getCategory("landslide_lhasa"), getCategory("nightlights_bm")]).toEqual(["fire", "land", "people"]);
    for (const [method, voice] of Object.entries(METHOD_APPLIED_TO)) expect([method, getCategory(method)]).toEqual([method, getCategory(voice)]);
  });
});
