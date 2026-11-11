// The leftovers: the live cards' numbers are the six live_*/validation.json files', equal to
// docs/official/VALIDATION_TABLE.md; the "Not playable" list is the pipeline's hidden flags; GPCC's dead path is gone.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { DATA_PATHS } from "@/lib/data/paths";
import { readData } from "@/lib/i18n/data-sentences";
import { checkResult, keyNumbers, LIVE_CHECK_RECORDS, pyG3 } from "@/lib/provenance/live-checks";
import type { OfficialIndex, OfficialValidationFile } from "@/types/data-contract";
import type { HealthFile } from "./health";
import { hiddenRecords } from "./hidden";

/** The table's rows for a record: [check cell, key numbers, result]. */
function tableRows(record: string): { check: string; numbers: string; result: string }[] {
  const md = readFileSync("docs/official/VALIDATION_TABLE.md", "utf8");
  return md
    .split("\n")
    .filter((l) => l.startsWith(`| ${record} |`))
    .map((l) => {
      const cells = l.split(" | ");
      return { check: cells[1], numbers: cells[4], result: cells[6].replace(/ \|$/u, "") };
    });
}

describe("live provenance cards read the six live validation files", () => {
  test("Python's .3g, as validate.py prints it", () => {
    expect(pyG3(0.9297673134365823)).toBe("0.93");
    expect(pyG3(-0.103)).toBe("-0.103");
    expect(pyG3(0.42)).toBe("0.42");
    expect(pyG3(1234.5)).toBe("1.23e+03");
    expect(pyG3(0.00001234)).toBe("1.23e-05");
  });
  for (const record of LIVE_CHECK_RECORDS) {
    test(`${record}: key numbers and result equal VALIDATION_TABLE.md`, () => {
      const file = readData<OfficialValidationFile>(`official/${record}/validation.json`);
      const rows = tableRows(record);
      expect(rows.length).toBe(file.checks.length);
      for (const c of file.checks) {
        const row = rows.find((r) => r.check.startsWith(`${c.id}: `));
        expect(row, c.id).toBeDefined();
        expect(keyNumbers(c.metrics)).toBe(row?.numbers ?? "");
        expect(row?.result.startsWith(checkResult(c))).toBe(true);
      }
    });
  }
});

describe("Not playable = the pipeline's hidden flags", () => {
  const index = readData<OfficialIndex>("related/index.json");
  const health = readData<HealthFile>("meta/health.json");
  test("the list is every hidden row, with its reason, and matches the health run's hidden list", () => {
    const list = hiddenRecords(index);
    expect(list.map((h) => h.record)).toEqual(["rel_4445", "rel_4658", "rel_4939"].filter((id) => list.some((h) => h.record === id)));
    expect(list.map((h) => [h.record, h.reason])).toEqual(health.hidden.map((h) => [h.record, h.reason]));
    for (const h of list) expect(h.reason.length).toBeGreaterThan(0);
  });
});

describe("DATA_PATHS.gpcc", () => {
  test("the dead path is deleted (GPCC's numbers come from the demo file Then vs Now reads)", () => {
    expect("gpcc" in DATA_PATHS).toBe(false);
  });
});
