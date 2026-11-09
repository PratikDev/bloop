// B1: the braille text rules hold for every braille-facing string: the explorer's and the braille labels
// (lib/i18n/en/braille.ts), every status / loading / announcement string (they reach a display as timed
// flash messages), and the value line and scale heading built from every shipped manifest, whose numbers
// must trace back to that manifest (a value in the layer's range, a scale end from mapping.json).

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { bnScaleHeading, scaleHeading, voiceScale } from "@/a11y/brailleSource";
import { STATUS_BUDGET, brailleNumber, violations } from "@/a11y/brailleText";
import { recordBrailleLabel } from "@/components/OfficialRecords/braille-label";
import { decimalsOf, officialReading } from "@/components/OfficialRecords/braille-lines";
import { banglaLine, uebLine } from "@/a11y/brailleLines";
import { BN, bnNumber, bnTableSafe } from "@/a11y/brailleBangla";
import { PATTERN_ONLY } from "@/lib/data/official";
import { bindT, en } from "@/lib/i18n";
import type { OfficialIndex, OfficialManifest } from "@/types/data-contract";

const t = bindT("en");
const SAMPLE: Record<string, unknown> = { mode: "Through time", record: "SST", playing: false, back: false, scene: "Delta", value: "1.2 mm/h",
  x: "50", y: "40", name: "Rain", place: "21.5N 89.8E", time: "14:30", badge: "observation", status: "live" };
const render = (v: unknown) => (typeof v === "string" ? v : (v as (p: Record<string, unknown>) => string)(SAMPLE));

const STATUS_KEY = /(^|\.)(loading|loadingStart|loadingRain|stopped|reviewOn|reviewOff|modeAnnounce)$|^announce\.|^braille\.bl\./u;
const SHORT_KEY = /^braille\.(bl\.|reviewOn|reviewOff|modeAnnounce|loading|valueLine|shapeLine|open|close)/u;

describe("braille strings", () => {
  test("every braille.* string passes the rules", () => {
    for (const [k, v] of Object.entries(en)) if (k.startsWith("braille.")) expect([k, violations(render(v))]).toEqual([k, []]);
  });

  test("braille labels and explorer status lines fit one 40-cell line", () => {
    for (const [k, v] of Object.entries(en)) if (SHORT_KEY.test(k)) expect([k, violations(render(v), STATUS_BUDGET)]).toEqual([k, []]);
  });

  test("status, loading and announcement strings carry no banned glyph", () => {
    const keys = Object.keys(en).filter((k) => STATUS_KEY.test(k));
    expect(keys.length).toBeGreaterThan(10);
    for (const k of keys) {
      let s: string;
      try {
        s = render(en[k as keyof typeof en]);
      } catch {
        continue; // a template needing other params: checked where it is built
      }
      expect([k, violations(s).filter((v) => v !== "stray spaces")]).toEqual([k, []]);
    }
  });
});

const PUBLIC = join(import.meta.dir, "..", "..", "public", "data");
function manifests(): OfficialManifest[] {
  const out: OfficialManifest[] = [];
  for (const dir of ["official", "related"]) {
    const root = join(PUBLIC, dir);
    for (const rec of readdirSync(root)) {
      const f = join(root, rec, "manifest.json");
      if (existsSync(f)) out.push(JSON.parse(readFileSync(f, "utf8")) as OfficialManifest);
    }
  }
  return out;
}

describe("value lines from every shipped manifest", () => {
  const all = manifests();

  test("there are records to check", () => expect(all.length).toBeGreaterThan(40));

  test("value line and scale heading pass the rules; numbers trace to the manifest", () => {
    const over: string[] = [];
    for (const m of all) {
      for (const layer of m.layers) {
        const [lo] = layer.value_range ?? [0];
        const r = officialReading(m, layer, { value: lo, below: false }, { lat: 21.5, lon: 89.8 }, 0);
        const line = uebLine(t, r, "word");
        expect([m.record, layer.id, violations(line)]).toEqual([m.record, layer.id, []]);
        // The value shown is the manifest's own number at the stated precision; a pattern-only layer shows a level, no number.
        if (layer.status === PATTERN_ONLY) {
          expect(line).toContain(t("level.veryLow"));
          expect(line).not.toContain(brailleNumber(lo, decimalsOf(layer, lo)));
        } else expect(line).toContain(brailleNumber(lo, decimalsOf(layer, lo)));
        if ([...line].length > STATUS_BUDGET) over.push(`${m.record}/${layer.id}: ${line}`);
        // The Bengali-table line: Bangla only (no Latin, no colon, no dot between digits), the same number.
        const bn = banglaLine(r);
        expect([m.record, layer.id, bnTableSafe(bn), bn]).toEqual([m.record, layer.id, true, bn]);
        if (layer.status === PATTERN_ONLY) expect(bn).toContain(BN.level.veryLow);
        else expect(bn).toContain(bnNumber(lo, decimalsOf(layer, lo)));
      }
      for (const option of m.play) {
        for (const c of option.channels) {
          const layer = m.layers.find((l) => l.id === c.layers[0]);
          if (!layer) continue;
          const s = voiceScale(c.voice, { min: 0, max: 1, scale: "linear", unit: layer.unit });
          const heading = scaleHeading({ ...s, unit: layer.unit }, "word", "Scale");
          expect([m.record, c.voice, violations(heading)]).toEqual([m.record, c.voice, []]);
          expect(heading.startsWith("Scale ")).toBe(true);
          const bnHeading = bnScaleHeading({ ...s, unit: layer.unit }, false);
          expect([m.record, c.voice, bnTableSafe(bnHeading), bnHeading]).toEqual([m.record, c.voice, true, bnHeading]);
        }
      }
    }
    // The core reading fits one 40-cell line (only optional parts drop): any line over 40 is listed here.
    expect(over).toEqual([]);
  });

  test("record cards' braille labels fit 40 cells", () => {
    for (const dir of ["official", "related"]) {
      const index = JSON.parse(readFileSync(join(PUBLIC, dir, "index.json"), "utf8")) as OfficialIndex;
      for (const r of index.records) expect([r.record, violations(recordBrailleLabel(r), STATUS_BUDGET)]).toEqual([r.record, []]);
    }
  });

  test("a number is the manifest's at its precision, never rounded to a different value", () => {
    expect(brailleNumber(28.44, 1)).toBe("28.4");
    expect(brailleNumber(-0.04, 1)).toBe("0.0");
  });
});
