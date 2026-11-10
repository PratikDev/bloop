// P1, Data health: the view model equals meta/health.json, row for row, and no local path ever reaches the page.
import { describe, expect, test } from "bun:test";
import { readData } from "@/lib/i18n/data-sentences";
import { healthOf, healthRows, looksLocal, type HealthFile } from "./health";

const file = readData<HealthFile>("meta/health.json");
const rows = healthRows(file);

describe("Data health matches meta/health.json", () => {
  test("one row per record, in the file's order", () => {
    expect(rows.map((r) => r.id)).toEqual(file.records.map((r) => r.id));
  });
  test("each row's times, lag and check counts are the file's", () => {
    for (const r of file.records) {
      const h = healthOf(file, r.id);
      expect(h).not.toBeNull();
      expect(h?.lastData).toBe(r.last_data_utc);
      expect(h?.sourceLatest).toBe(r.source_latest_utc);
      expect(h?.lagDays).toBe(r.lag_days);
      expect(h?.passed).toBe(r.checks.filter((c) => c.ok === true).length);
      expect(h?.failed).toBe(r.checks.filter((c) => c.ok === false).length);
      expect(h?.runUtc).toBe(file.generated_utc);
    }
  });
  test("the live records carry their lag (sst, rain)", () => {
    for (const id of ["sst", "rain"]) expect(typeof healthOf(file, id)?.lagDays).toBe("number");
  });
  test("an id the run doesn't have gives null (the panel says so)", () => {
    expect(healthOf(file, "no_such_record")).toBeNull();
  });
});

describe("never a local path", () => {
  test("the detector catches drives, shares, homes and the repo's raw folders", () => {
    for (const s of [String.raw`D:\Jukebox\nasa-sac\x`, "C:/Users/a", String.raw`\\server\share`, "/home/a/b", "data_raw/5022", "pipeline/svs/cache"]) expect(looksLocal(s)).toBe(true);
    for (const s of ["2026-11-06T05:00Z", "files exist and load", "Ocean temperature (EIC frame)"]) expect(looksLocal(s)).toBe(false);
  });
  test("no shown field of any row looks like a local path", () => {
    for (const r of rows) for (const s of [r.title, r.lastData ?? "", r.sourceLatest ?? "", ...r.failedChecks]) expect(looksLocal(s), `${r.id}: ${s}`).toBe(false);
  });
});
