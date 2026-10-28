// Guardrail checks for the §15 integration (docs/data-integration-plan.md §10), run by `bun test`:
// one scale per comparison, model badges and timbre, the S-NPP rule, and no number typed next to
// a unit in UI strings (numbers come from pipeline JSON or mapping.json).

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { continuousRule, MAPPING, voiceSpec } from "@/lib/audio/mapping";
import { isModel } from "@/lib/data/freshness";
import type { FreshnessFile, SstAnomalyMetadata } from "@/types/data-contract";

const pub = (rel: string) => JSON.parse(readFileSync(new URL(`../../public/data/${rel}`, import.meta.url), "utf8"));
const freshness: FreshnessFile = pub("meta/freshness.json");

describe("one scale for every comparison (guardrail 2)", () => {
  test("the GRACE water bass is one fixed range for every region, not per series", () => {
    expect(voiceSpec("water").mapping?.kind).toBe("continuous");
  });
  test("proof in unison plays both values on the Ocean rule itself", () => {
    expect(continuousRule("unison")).toBe(continuousRule("ocean"));
  });
  test("the normal tone's input range is the 5176 frame's own legend range", () => {
    const meta: SstAnomalyMetadata = pub("latest/sst_anom.json");
    const rule = continuousRule("normalTone");
    expect([rule.input.min, rule.input.max]).toEqual(meta.value_range);
  });
});

describe("badges and freshness (guardrails 15, 16)", () => {
  const voices = MAPPING.voices.filter((v) => v.source.product);
  test("every voice's product is in meta/freshness.json", () => {
    for (const v of voices) expect(freshness.products[v.source.product ?? ""], v.id).toBeDefined();
  });
  test("a voice on a model or inventory product plays in the model family, and only then", () => {
    for (const v of voices) expect(v.sound.family === "model", v.id).toBe(isModel(freshness.products[v.source.product ?? ""]));
  });
  test("every product carries a credit line", () => {
    for (const e of Object.values(freshness.products)) if (e.status !== "missing") expect(e.credit.length, e.product).toBeGreaterThan(0);
  });
  test("no current product reads S-NPP (NOAA-20/21 only after 2 Nov 2026)", () => {
    for (const e of Object.values(freshness.products)) {
      if (e.limit_days === null) continue;
      for (const d of e.datasets) expect(/SNPP|S-NPP|Suomi|VNP/i.test(`${d.id} ${d.name}`), `${e.product}: ${d.name}`).toBe(false);
    }
  });
});

// Numbers typed next to a unit are allowed only where they are not data: control step sizes, drawing
// scales and product names. Anything else must be a {param} filled from JSON.
const NOT_DATA: Record<string, string> = {
  "map.instructions": "key step size",
  "key.arrows.action": "key step size",
  "turntable.instructions": "key step size",
  "key.tt.leftRight.action": "key step size",
  "key.tt.upDown.action": "key step size and needle limit",
  "key.tt.opacity.action": "opacity steps",
  "scenes.scrub.rain": "the time-lapse's window (48 half-hours)",
  "scenes.terrain.canvas": "the time-lapse's window",
  "scenes.ghost.honesty": "GRACE's stated resolution",
  "scenes.ghost.scale.heat": "drawing scale",
  "scenes.ghost.scale.rain": "drawing scale",
  "scenes.ghost.scale.water": "drawing scale",
  "scenes.terrain.height": "drawing scale",
  "scenes.terrain.clarity": "product name (MUR's 1 km infrared data)",
  "scenes.terrain.clarityNone": "product name (MUR's 1 km infrared data)",
};
const UNIT = /(?<![\w${.])\d[\d.,]*\s?(°C|°|mm\/h|mm\/day|%|km|cm|ppm|psu|W\/m²|µg\/m³|m³\/s|nW|semitones?|degrees?|days?|hours?|years?)\b/;

test("no UI string types a number next to a unit (guardrail 8: captions from JSON)", () => {
  const dir = new URL("./i18n/en/", import.meta.url);
  const offenders: string[] = [];
  for (const file of readdirSync(dir)) {
    let key: string | null = null;
    for (const line of readFileSync(new URL(file, dir), "utf8").split("\n")) {
      const k = line.match(/^\s*"([\w.]+)":/);
      if (k) key = k[1];
      const code = line.replace(/\/\/.*$/, "").replace(/\$\{[^}]*\}/g, "");
      if (key && UNIT.test(code) && !(key in NOT_DATA)) offenders.push(`${file}: ${key}`);
    }
  }
  expect(offenders).toEqual([]);
});
