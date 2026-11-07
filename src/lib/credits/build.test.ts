// Credits follow-up to mentor item 5 ("credits must match what plays"): built from the record registry, every source a
// playing record uses is under "Data in this app", nothing there is testing-only, and nothing under "Used in our
// testing" is used by a playing record. Read from the shipped files, so a new record or voice is checked with no edit.
import { describe, expect, test } from "bun:test";
import { listedRelated } from "@/lib/data/official";
import { readData } from "@/lib/i18n/data-sentences";
import { bindT } from "@/lib/i18n";
import { violations } from "@/a11y/brailleText";
import type { FreshnessFile, OfficialIndex } from "@/types/data-contract";
import { buildCredits, playedProducts, splitProvider, type CreditInputs } from "./build";
import { SURFACES, voiceProduct } from "./surfaces";
import { CREDIT_GROUPS, type CreditEntry } from "./types";
import { creditsEn } from "../i18n/en/credits";

const freshness = readData<FreshnessFile>("meta/freshness.json");
const official = readData<OfficialIndex>("official/index.json");
const relatedAll = readData<OfficialIndex>("related/index.json");
const inputs: CreditInputs = { freshness, official, related: listedRelated(relatedAll) };
const credits = buildCredits(inputs);
const data = CREDIT_GROUPS.flatMap((g) => credits.data[g]);
const dataIds = new Set(data.map((e) => e.id));
const testingIds = new Set(credits.testing.map((e) => e.id));
const recordsOf = (entries: CreditEntry[]) => new Set(entries.flatMap((e) => e.records));

/** Every product that plays, independently of build.ts: the pages' voices, and every listed record's manifest. */
function playingProducts(): Set<string> {
  const out = new Set<string>();
  for (const s of SURFACES) {
    for (const v of s.voices) {
      const p = voiceProduct(v);
      if (p) out.add(p);
    }
    for (const p of s.products ?? []) out.add(p);
  }
  const manifests = new Set([
    ...official.records.map((r) => `official/${r.manifest}`),
    ...inputs.related.records.map((r) => `related/${r.manifest}`),
  ]);
  for (const e of Object.values(freshness.products)) if (manifests.has(e.outputs[0])) out.add(e.product);
  return out;
}

const playing = playingProducts();
const checkOnly = (pid: string) => new Set(freshness.products[pid]?.checked_against ?? []);
const isFrame = (id: string) => /^(svs|eic_)/u.test(id);

describe("credits from the registry", () => {
  test("every product a page plays is in the registry, and the builder agrees on what plays", () => {
    for (const p of playing) expect([p, p in freshness.products]).toEqual([p, true]);
    expect(new Set(playedProducts(inputs).keys())).toEqual(playing);
  });

  test("every playable record's sources are under Data in this app", () => {
    const credited = recordsOf(data);
    for (const pid of playing) {
      const e = freshness.products[pid];
      expect([pid, credited.has(pid)]).toEqual([pid, true]);
      for (const d of e.datasets) {
        if (checkOnly(pid).has(d.id) || isFrame(d.id)) continue;
        expect([pid, d.id, dataIds.has(d.id)]).toEqual([pid, d.id, true]);
      }
    }
  });

  test("every listed Official and Related record with an SVS page is credited to SVS with its IDs", () => {
    const svs = credits.data.svs;
    for (const r of [...official.records, ...inputs.related.records]) {
      if (!r.svs_ids.length) continue;
      const entry = svs.find((e) => e.records.includes(r.record));
      expect([r.record, entry?.provider.includes(`SVS ${r.svs_ids.join(", ")}`)]).toEqual([r.record, true]);
      expect(entry?.link).toBe(`https://svs.gsfc.nasa.gov/${r.svs_ids[0]}/`);
    }
  });

  test("nothing under Used in our testing is used by a playable record", () => {
    for (const pid of playing) {
      for (const d of freshness.products[pid].datasets) {
        if (checkOnly(pid).has(d.id)) continue;
        expect([pid, d.id, testingIds.has(d.id)]).toEqual([pid, d.id, false]);
      }
    }
    for (const e of credits.testing) expect([e.id, e.pages]).toEqual([e.id, []]);
    for (const id of testingIds) expect([id, dataIds.has(id)]).toEqual([id, false]);
  });

  test("hidden related records and the hidden Then vs Now parts add nothing", () => {
    const hidden = relatedAll.records.filter((r) => r.hidden).map((r) => r.record);
    expect(hidden.length).toBeGreaterThan(0);
    for (const r of hidden) expect([r, recordsOf(data).has(r)]).toEqual([r, false]);
    // Fires and vegetation are hidden (item 5): their datasets are testing-only unless another record plays them.
    for (const pid of ["firms", "ndvi"]) {
      expect(playing.has(pid)).toBe(false);
      for (const d of freshness.products[pid].datasets) expect([d.id, dataIds.has(d.id)]).toEqual([d.id, false]);
    }
  });

  test("check-only datasets are never credited as played", () => {
    for (const pid of playing) for (const id of checkOnly(pid)) expect([pid, id, dataIds.has(id)]).toEqual([pid, id, false]);
  });

  test("every entry has a name, a provider, where it plays, and an https link or none", () => {
    for (const e of data) {
      expect([e.id, e.name.length > 0, e.provider.length > 0, e.pages.length > 0]).toEqual([e.id, true, true, true]);
      if (e.link !== null) expect(e.link).toStartWith("https://");
    }
  });

  test("a provider comes from the registry, else the name's bracket, else the agency", () => {
    expect(splitProvider({ id: "mur", name: "MUR SST v4.1 (NASA/JPL PO.DAAC)", agency: "NASA" })).toEqual({ name: "MUR SST v4.1", provider: "NASA/JPL PO.DAAC" });
    expect(splitProvider({ id: "gpcp", name: "GPCP v2.3 (via NOAA PSL)", agency: "NASA" })).toEqual({ name: "GPCP v2.3", provider: "NOAA PSL" });
    expect(splitProvider({ id: "x", name: "Thing (5 km)", agency: "NOAA", provider: "NOAA CRW" })).toEqual({ name: "Thing (5 km)", provider: "NOAA CRW" });
    expect(splitProvider({ id: "y", name: "Plain", agency: "NASA" })).toEqual({ name: "Plain", provider: "NASA" });
    expect(splitProvider({ id: "svs5101", name: "EIC frame: SVS 5101", agency: "NASA" }).provider).toBe("NASA's Scientific Visualization Studio");
  });
});

describe("credit strings", () => {
  test("pass the braille text rules, in both languages", () => {
    for (const lang of ["en", "bn"] as const) {
      const t = bindT(lang);
      for (const key of Object.keys(creditsEn) as (keyof typeof creditsEn)[]) {
        const text = key === "credits.group.count" ? t(key, { count: "5" }) : key === "credits.plays" ? t(key, { pages: "Listen" }) : key === "credits.link" ? t(key, { name: "MUR" }) : t(key);
        expect([lang, key, violations(text)]).toEqual([lang, key, []]);
      }
    }
  });
});
