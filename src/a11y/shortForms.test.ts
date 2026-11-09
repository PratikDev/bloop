// Plan item 12: every new description and stat line has a short form within one 40-cell line, under the braille text
// rules, safe for the Bengali table, with the numbers of the full line (shipped data: the live frames' metadata, the
// freshness file's datasets, values across each record's range).
import { describe, expect, test } from "bun:test";
import { readData } from "@/lib/i18n/data-sentences";
import { sourceDataset } from "@/lib/provenance/live";
import { bindT } from "@/lib/i18n";
import type { FreshnessFile, RainMetadata, SstMetadata } from "@/types/data-contract";
import { bnTableSafe } from "./brailleBangla";
import { STATUS_BUDGET, brailleNumber, violations } from "./brailleText";
import { compareShort, describeShort, provenanceShort, sonarShort, type LiveValue } from "./shortForms";

const LANGS = ["en", "bn"] as const;
const DEGREES = ["symbol", "word"] as const;
const sst = readData<SstMetadata>("latest/sst.json");
const rain = readData<RainMetadata>("latest/rain.json");
const freshness = readData<FreshnessFile>("meta/freshness.json");

/** English: one 40-cell line under the rules. Bangla: the rules and the Bengali table's limits (it spells numbers and
 *  words out, so it has no cell budget, like the explorer's own Bangla value line). */
function ok(line: string, lang: (typeof LANGS)[number]) {
  expect([line, violations(line, lang === "en" ? STATUS_BUDGET : undefined)]).toEqual([line, []]);
  if (lang === "bn") expect([line, bnTableSafe(line)]).toEqual([line, true]);
}

const spots = [
  { lat: 21.5, lon: 89.8 },
  { lat: -64.25, lon: -179.75 },
  { lat: 0, lon: 0 },
];
const values: LiveValue[] = [
  ...[-1.8, 0, 12.34, 31.9, null].flatMap((value) => spots.map((at): LiveValue => ({ record: "ocean", value, frozen: false, at, timeUtc: sst.frame_time_utc }))),
  ...[0, 0.2, 9.9, 48.7, null].flatMap((value) => spots.map((at): LiveValue => ({ record: "rain", value, frozen: value === 0.2, at, timeUtc: rain.frame_time_utc }))),
];

describe("short forms: one 40-cell line in English; the Bengali table's rules in Bangla", () => {
  for (const lang of LANGS)
    for (const degree of DEGREES) {
      const t = bindT(lang);
      test(`${lang}, ${degree}: D's description (one record and both), the sonar's find`, () => {
        for (const v of values) {
          ok(describeShort(t, lang, degree, [v]), lang);
          ok(sonarShort(t, lang, degree, v), lang);
        }
        for (let i = 0; i < 5; i++) ok(describeShort(t, lang, degree, [values[i], values[15 + i]]), lang);
      });

      test(`${lang}, ${degree}: a Compare result (each layer, rises, falls, no data)`, () => {
        for (const layer of ["heat", "rain", "water"] as const)
          for (const [a, b] of [[1.23, 0.4], [-12.5, 3.75], [null, 2]] as const) {
            const r = { layer, cell: spots[0], a: { month: "2001-08", value: a }, b: { month: "2023-08", value: b }, diff: a === null ? null : b - a };
            const line = compareShort(lang, degree, r);
            ok(line, lang);
            if (lang === "en" && a !== null) expect(line).toContain(brailleNumber(Math.abs(b - a), layer === "water" ? 1 : 2));
          }
      });

      test(`${lang}: the provenance line for each live record (the freshness file's datasets)`, () => {
        for (const [record, product, meta] of [["ocean", "sst", sst], ["rain", "rain", rain]] as const) {
          const source = sourceDataset(freshness, product);
          if (!source) continue;
          ok(provenanceShort(lang, record, source, meta), lang);
        }
      });
    }
});

test("the value is the full line's: D's short form carries the needle's number at the record's precision", () => {
  const t = bindT("en");
  const line = describeShort(t, "en", "word", [{ record: "ocean", value: 29.84, frozen: false, at: spots[0], timeUtc: sst.frame_time_utc }]);
  expect(line).toMatch(/^SST 29\.8C /u);
});
