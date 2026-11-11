// Track 0's steps (values from mapping.json, each record's source line from its metadata and
// the registry), and that Track 0 opens once, is remembered when finished or skipped, and is offered again from Help.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initialState, reducer, withTuning } from "@/components/AppState/reducer";
import { pickPrefs } from "@/components/AppState/prefs";
import { bindT, type Lang } from "@/lib/i18n";
import type { FreshnessFile, RainMetadata, SstMetadata } from "@/types/data-contract";
import { tuningSteps } from "./steps";

const json = <T,>(rel: string) => JSON.parse(readFileSync(join(import.meta.dir, "../../../public/data", rel), "utf8")) as T;
const sources = { freshness: json<FreshnessFile>("meta/freshness.json"), sst: json<SstMetadata>("latest/sst.json"), rain: json<RainMetadata>("latest/rain.json") };
const said = (lang: Lang) => tuningSteps(sources).map((s) => s.text(bindT(lang), lang));

describe("Track 0 steps", () => {
  test("in order: intro, reference, ocean anchors and source, rain anchors, snow, rain source, no data, grammar, done", () => {
    expect(tuningSteps(sources).map((s) => s.id)).toEqual(["intro", "reference", "oceanLow", "oceanHigh", "oceanSource", "rainLow", "rainHigh", "snow", "rainSource", "nodata", "grammar", "done"]);
  });

  test("the anchors and the reference are mapping.json's own values", () => {
    const en = said("en");
    expect(en[1]).toContain("The reference tone: 15 degrees Celsius");
    expect(en[2]).toContain("lowest anchor: 0 degrees Celsius");
    expect(en[3]).toContain("highest anchor: 30 degrees Celsius");
    expect(en[5]).toContain("lowest anchor: 0.5 millimetres an hour");
    expect(en[6]).toContain("highest anchor: 25 millimetres an hour");
    expect(en[7]).toContain("as bells: 5 millimetres an hour");
  });

  test("each record's source line: product, cell size, date, observation", () => {
    const en = said("en");
    expect(en[4]).toBe("MUR SST v4.1 (NASA/JPL PO.DAAC): a NASA observation. Cells 0.35 degrees across, about 39 kilometres at the equator. This frame: 4 Nov 2026, 00:00 UTC.");
    expect(en[8]).toMatch(/^GPM IMERG half-hourly V07 \(NASA\/JAXA, GES DISC\): a NASA observation\. Cells 0\.20 degrees across, about 22 kilometres at the equator\. This frame: /u);
    expect(said("bn")[4]).toContain("পর্যবেক্ষণ");
  });

  test("without the registry, the source lines are left out, never said empty", () => {
    const ids = tuningSteps({ ...sources, freshness: null }).map((s) => s.id);
    expect(ids).not.toContain("oceanSource");
    expect(ids).not.toContain("rainSource");
  });
});

describe("Track 0 opens once", () => {
  test("after the intro (or a silent start) until finished or skipped; then remembered; Help opens it again", () => {
    expect(withTuning({ ...initialState, introDone: true }, true).tuning).toBe(true);
    expect(withTuning({ ...initialState, introDone: true }, false).tuning).toBe(false);
    const ended = reducer({ ...initialState, tuning: true }, { type: "endTuning" });
    expect(ended).toMatchObject({ tuning: false, tuned: true });
    expect(pickPrefs(ended).tuned).toBe(true);
    expect(withTuning(ended, true).tuning).toBe(false);
    expect(reducer(ended, { type: "startTuning" }).tuning).toBe(true);
  });
});
