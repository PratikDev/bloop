// Credits follow the registry: once the DATA records are on the shelf (their index rows name the products they play),
// every source they play moves to "Data in this app", and nothing they play is left under "Used in our testing".
import { describe, expect, test } from "bun:test";
import { buildCredits } from "@/lib/credits/build";
import { CREDIT_GROUPS } from "@/lib/credits/types";
import { listedRelated } from "@/lib/data/official";
import { readData } from "@/lib/i18n/data-sentences";
import type { FreshnessFile, OfficialIndex } from "@/types/data-contract";
import { APP_RECORD_IDS, APP_RECORDS, type AppIndexRow } from "./records";

const freshness = readData<FreshnessFile>("meta/freshness.json");
const official = readData<OfficialIndex>("official/index.json");
const related = listedRelated(readData<OfficialIndex>("related/index.json"));
const rows: AppIndexRow[] = APP_RECORD_IDS.map((id) => ({ record: id, title: id, svs_ids: [], badge: "observation", period: "", manifest: `app:${id}`, products: APP_RECORDS[id].products }));

describe("credits with the DATA records", () => {
  const before = buildCredits({ freshness, official, related });
  const after = buildCredits({ freshness, official: { records: [...official.records, ...rows] }, related });
  const ids = (c: typeof before) => new Set(CREDIT_GROUPS.flatMap((g) => c.data[g]).map((e) => e.id));
  test("every dataset of every product they play is under Data in this app", () => {
    const played = new Set(APP_RECORD_IDS.flatMap((id) => APP_RECORDS[id].products));
    for (const p of played) {
      const entry = freshness.products[p];
      expect(entry, p).toBeDefined();
      for (const d of entry.datasets.filter((x) => !/^(svs|eic_)/u.test(x.id))) expect(ids(after).has(d.id), `${p}: ${d.id}`).toBe(true);
    }
  });
  test("they moved out of testing, and nothing else changed group", () => {
    const testingAfter = new Set(after.testing.map((e) => e.id));
    for (const id of ids(after)) expect(testingAfter.has(id), id).toBe(false);
    for (const id of ids(before)) expect(ids(after).has(id), id).toBe(true);
  });
  test("the SVS frames they play are credited as visualizations", () => {
    const svs = after.data.svs.map((e) => e.provider).join(" ");
    for (const n of ["5315", "5584", "5113"]) expect(svs).toContain(n);
  });
});
