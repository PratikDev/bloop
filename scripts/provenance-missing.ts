// Lists the Official and Related record layers whose "How we got this" panel shows a field as "not available"
// Usage: bun scripts/provenance-missing.ts
import { listedRelated } from "@/lib/data/official";
import { bindT } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import { officialProvenance } from "@/lib/provenance/official";
import { FACT_FIELDS } from "@/lib/provenance/types";
import type { FreshnessFile, OfficialIndex, OfficialManifest, OfficialValidationFile } from "@/types/data-contract";

const freshness = readData<FreshnessFile>("meta/freshness.json");
const rows = [
  ...readData<OfficialIndex>("official/index.json").records.map((r) => ["official", r] as const),
  ...listedRelated(readData<OfficialIndex>("related/index.json")).records.map((r) => ["related", r] as const),
];
const counts = new Map<string, number>();
for (const [dir, row] of rows) {
  const m = readData<OfficialManifest>(`${dir}/${row.manifest}`);
  const v = readData<OfficialValidationFile>(`${dir}/${row.record}/validation.json`);
  const missing = new Set<string>();
  for (const layer of m.layers) {
    const p = officialProvenance({ t: bindT("en"), lang: "en", freshness, place: "needle" }, m, layer, v);
    for (const f of FACT_FIELDS) if (p[f] === null && !(f === "uncertainty" && p.patternOnly)) missing.add(f);
  }
  for (const f of missing) counts.set(f, (counts.get(f) ?? 0) + 1);
  if (missing.size) console.log(`${m.record}: ${[...missing].join(", ")}`);
}
console.log(`\n${rows.length} records; records missing each field: ${[...counts].map(([f, n]) => `${f} ${n}`).join(", ")}`);
