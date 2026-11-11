// "How we got this" says only what the files say. Each field is compared with the manifest, the frame
// metadata, stats.json or the registry it comes from; a missing field stays null ("not available"), never a guess.
import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import { voiceProduct } from "@/lib/credits/surfaces";
import { listedRelated } from "@/lib/data/official";
import { bindT, formatInteger, formatUtc } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import { longLine, partStats } from "@/lib/then-now-stats";
import { cityDemo, windowLabel } from "@/lib/then-now";
import type { CitiesThenNowFile, DhakaThenNowDemo, FreshnessFile, GraceContextFile, OfficialIndex, OfficialManifest, OfficialValidationFile, RainMetadata, SstMetadata } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { provenanceEn } from "../i18n/en/provenance";
import { datasetLink, gapProvenance, oceanProvenance, rainProvenance, versionOf } from "./live";
import { officialProvenance } from "./official";
import { thenNowProvenance } from "./then-now";
import type { Provenance } from "./types";

const freshness = readData<FreshnessFile>("meta/freshness.json");
const sst = readData<SstMetadata>("latest/sst.json");
const rain = readData<RainMetadata>("latest/rain.json");
const stats = readData<ThenNowStatsFile>("thenvsnow/stats.json");
const demo = readData<DhakaThenNowDemo>("demo/dhaka_then_now.json");
const cities = readData<CitiesThenNowFile>("demo/cities_then_now.json");
const grace = readData<GraceContextFile>("context/grace.json");
const LANGS = ["en", "bn"] as const;
const WESTERN = /[0-9]/u;
const ctx = (lang: (typeof LANGS)[number]) => ({ t: bindT(lang), lang, freshness, place: null });

describe("live frames (Listen, Turntable)", () => {
  test("every field is the frame metadata's or the registry's", () => {
    for (const lang of LANGS) {
      const o = oceanProvenance(ctx(lang), sst);
      expect(o.dataset).toBe(sst.source_dataset);
      expect(o.version).toBe(versionOf(sst.source_dataset));
      expect(sst.source_dataset).toContain(o.version ?? "no version found");
      expect(o.link).toBe(datasetLink(freshness, voiceProduct("ocean")));
      expect(o.link).toStartWith("https://");
      expect(o.window).toContain(formatUtc(sst.frame_time_utc, lang));
      expect(o.n).toContain(formatInteger(sst.verified.n_points, lang));
      expect(o.status).toBe("verified");
      expect(o.validation?.label).toContain("live_sst");
      const r = rainProvenance(ctx(lang), rain);
      expect(r.dataset).toBe(rain.source_dataset);
      expect(r.n).toContain(formatInteger(rain.verified.n_points, lang));
      expect(r.uncertainty).toContain(formatInteger(rain.verified.approx_percent, lang));
      expect(r.status).toBe("values with stated error");
      expect(r.validation?.label).toContain("live_rain");
      const g = gapProvenance(ctx(lang), sst, rain);
      expect(g?.window).toContain(formatUtc(rain.frame_time_utc, lang));
    }
  });
});

describe("Then vs Now", () => {
  test("each city's part: windows, n, uncertainty and links from the files", () => {
    for (const city of cities.cities) {
      for (const part of ["heat", "monsoon", "water"] as const) {
        for (const lang of LANGS) {
          const t = bindT(lang);
          const p = thenNowProvenance({ t, lang, freshness, cityName: city.name, city, demo: cityDemo(demo, city), grace, stats }, part);
          expect([city.name, part, p.uncertainty]).toEqual([city.name, part, longLine(t, lang, partStats(stats, city.name, part))]);
          expect(p.link).toBe(datasetLink(freshness, voiceProduct(part)));
          expect(p.validation?.href).toEndWith(stats.method.doc);
          expect(p.scripts.map((s) => s.label)).toContain(stats.method.script);
          expect(p.status).toBe("file");
          if (part === "water") {
            expect(p.n).toContain(formatInteger(stats.water.Bangladesh.trend.n, lang));
            expect(p.cell).toContain(formatInteger(grace.mascon_deg ?? NaN, lang));
          } else {
            const rec = part === "heat" ? city.heat : city.rain.gpcp;
            const cmp = part === "heat" ? stats.cities[city.name].heat : stats.cities[city.name].rain.gpcp;
            expect(p.window).toContain(windowLabel(rec.A));
            expect(p.window).toContain(windowLabel(rec.B));
            expect(p.n).toContain(formatInteger(cmp.A.n, lang));
          }
          if (lang === "bn") expect([city.name, part, WESTERN.test(p.n ?? "")]).toEqual([city.name, part, false]);
        }
      }
    }
  });
});

const official = readData<OfficialIndex>("official/index.json");
const related = listedRelated(readData<OfficialIndex>("related/index.json"));
const records = [...official.records.map((r) => ["official", r] as const), ...related.records.map((r) => ["related", r] as const)];

describe("Official and Related records", () => {
  test("status, window, grid, statement and validation row are the manifest's; pattern-only shows no number", () => {
    for (const [dir, row] of records) {
      const m = readData<OfficialManifest>(`${dir}/${row.manifest}`);
      const v = readData<OfficialValidationFile>(`${dir}/${row.record}/validation.json`);
      for (const layer of m.layers) {
        const p: Provenance = officialProvenance(ctx("en"), m, layer, v);
        expect([m.record, layer.id, p.status]).toEqual([m.record, layer.id, layer.status]);
        expect(p.window).toBe(m.period.label);
        expect(p.validation?.label).toContain(m.record);
        if (layer.status === "pattern only") {
          expect([m.record, p.patternOnly !== null, p.uncertainty]).toEqual([m.record, true, null]);
        } else {
          expect(p.uncertainty).toBe(layer.statement);
        }
      }
    }
  });
});

describe("strings", () => {
  test("pass the braille text rules in EN and BN", () => {
    const sample: Record<string, string> = { subject: "Dhaka Heat", why: "no key", city: "Dhaka", part: "Heat", record: "Air", deg: "2", width: "1", height: "1", aggregation: "mean", lat: "23", lon: "91", cell: "c", cities: "Sylhet", box: "Bangladesh", place: "21N", n: "60", time: "4 Nov", meaning: "start", a: "1981", b: "2010", formula: "f", season: "June", test: "MK", median: "0.3", p90: "0.7", bias: "0.1", percent: "27", agree: "100", rho: "0.9" };
    for (const lang of LANGS) {
      const t = bindT(lang) as unknown as (k: string, p?: Record<string, string>) => string;
      for (const key of Object.keys(provenanceEn)) expect([lang, key, violations(t(key, sample))]).toEqual([lang, key, []]);
    }
  });
});
