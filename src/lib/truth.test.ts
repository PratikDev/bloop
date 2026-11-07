// Mentor item 6: the How we know cards' key numbers are VALIDATION_TABLE.md's (read from sst.json / rain.json
// `verified`, which the card shows), and no "Coming in October" or "Not built yet" text is left anywhere in the app.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { readData } from "@/lib/i18n/data-sentences";
import { captionText, en } from "@/lib/i18n";

/** A record's "Key numbers" cell in docs/official/VALIDATION_TABLE.md, as { name: value }. */
function keyNumbers(record: string): Record<string, number> {
  const table = readFileSync("docs/official/VALIDATION_TABLE.md", "utf8");
  const row = table.split("\n").find((l) => l.startsWith(`| ${record} |`));
  if (!row) throw new Error(`no VALIDATION_TABLE row for ${record}`);
  const cell = row.split("|")[5];
  return Object.fromEntries(
    cell.split(";").map((kv) => kv.trim().split(" ")).filter(([, v]) => v !== undefined && !Number.isNaN(Number(v))).map(([k, v]) => [k, Number(v)]),
  );
}

describe("How we know numbers match VALIDATION_TABLE.md", () => {
  test("ocean: median error, p90 and n", () => {
    const v = readData<{ verified: { value: number; p90_abs_error_C: number; n_points: number } }>("latest/sst.json").verified;
    const row = keyNumbers("live_sst");
    expect([v.value, v.p90_abs_error_C, v.n_points]).toEqual([row.value, row.p90_abs_error_C, row.n_points]);
  });

  test("rain: typical difference, n and agreement", () => {
    const v = readData<{ verified: { approx_percent: number; n_points: number; agreement: number } }>("latest/rain.json").verified;
    const row = keyNumbers("live_rain");
    expect([v.approx_percent, v.n_points, v.agreement]).toEqual([row.approx_percent, row.n_points, row.agreement]);
  });

  test("rho and n come from the shipped pairs (truth/stats.json)", () => {
    const s = readData<{ sst: { n: number }; rain: { n: number } }>("truth/stats.json");
    expect(s.sst.n).toBe(readData<{ pairs: unknown[] }>("truth/sst_pairs.json").pairs.length);
    expect(s.rain.n).toBe(readData<{ pairs: { kind: string }[] }>("truth/rain_pairs.json").pairs.filter((p) => p.kind === "rain").length);
  });
});

describe("no unfinished-feature promises", () => {
  const STALE = /coming in october|not built yet/iu;
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/u.test(f) && !p.endsWith("truth.test.ts") ? [p] : [];
    });

  test("no source file says it", () => {
    expect(files("src").filter((f) => STALE.test(readFileSync(f, "utf8")))).toEqual([]);
  });

  test("no English or Bangla string says it", () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      const v = en[k];
      if (typeof v === "string") expect([k, STALE.test(v) || /অক্টোবরে আসছে/u.test(captionText("bn", k, {}))]).toEqual([k, false]);
    }
  });
});
