// A letter to the future: every number comes from the engine's reading and the frame's own file; the text passes the
// braille rules; English and Bangla; the saved .txt wraps to 40 cells.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { violations } from "@/a11y/brailleText";
import { liveLetter } from "@/components/Art/Letter/use-listen-letter";
import { readUint16LE } from "@/lib/data/grid";
import { bindT, formatFixed, formatTemperature, LANGS } from "@/lib/i18n";
import { readAt } from "@/lib/reading";
import type { LiveFields } from "@/lib/data";
import type { SstMetadata } from "@/types/data-contract";
import { LETTER_WIDTH, letterLines, letterText, type LetterInput } from "./letter";

const ROOT = process.cwd();
function fields(): LiveFields {
  const meta = JSON.parse(readFileSync(join(ROOT, "public/data/latest/sst.json"), "utf8")) as SstMetadata;
  const b = readFileSync(join(ROOT, "public/data/latest/sst.bin"));
  return { sst: { meta, codes: readUint16LE(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), meta.grid) }, rain: null } as LiveFields;
}
const BAY = { lat: 18.5, lon: 89.5 };

describe("a letter to the future", () => {
  const f = fields();
  test("the value is the engine's reading, the date and error are the frame file's", () => {
    const t = bindT("en");
    const l = liveLetter(t, f, BAY, "ocean", "Bay of Bengal", null);
    const valueC = readAt(f, BAY).ocean.valueC as number;
    expect(l.reading).toEqual({ kind: "ocean", valueC, medianC: f.sst.meta.verified.value });
    expect(l.date).toBe(f.sst.meta.frame_time_utc.slice(0, 10));
    const text = letterLines(t, "en", l).join(" ");
    expect(text).toContain(`Sea surface ${formatTemperature(valueC, "en")}.`);
    expect(text).toContain(`Median error ${formatFixed(f.sst.meta.verified.value, "en", 2)} degrees.`);
    expect(text).toContain(f.sst.meta.source_dataset);
  });

  test("pattern-only and no-value letters record no number", () => {
    const t = bindT("en");
    const base = { place: "Somewhere", date: "2026-11-06", source: "X", link: null };
    expect(letterLines(t, "en", { ...base, reading: { kind: "pattern", record: "Lightning" } }).join(" ")).toBe("Somewhere, 6 Nov 2026. Lightning: pattern only; no value recorded.");
    expect(letterLines(t, "en", { ...base, reading: { kind: "none" } }).join(" ")).not.toMatch(/\d+\.\d/u);
  });

  test("English and Bangla pass the braille rules; the .txt wraps to 40 cells", () => {
    for (const lang of LANGS) {
      const t = bindT(lang);
      const l: LetterInput = liveLetter(t, f, BAY, "ocean", "Bay of Bengal", "https://podaac.jpl.nasa.gov/");
      for (const line of letterLines(t, lang, l)) expect([lang, line, violations(line).filter((v) => v !== "stray spaces")]).toEqual([lang, line, []]);
      const txt = letterText(t, lang, l);
      for (const line of txt.split("\n")) expect(line.length).toBeLessThanOrEqual(LETTER_WIDTH);
      expect(txt).toContain(l.date);
    }
  });
});
