import type { DatasetRef, FreshnessEntry, FreshnessFile, OfficialIndex, OfficialIndexRow } from "@/types/data-contract";
import { SURFACES, voiceProduct } from "./surfaces";
import { appProducts } from "@/lib/earth/records";
import { CREDIT_GROUPS, CREDIT_PAGES, type CreditEntry, type CreditGroup, type CreditPage, type CreditsList } from "./types";

const FRAME = /^(svs|eic_)/u;
const PLACEHOLDER = /^svs_related_/u;
const SVS_ID = /^svs(\d+)$/u;
const SVS_PROVIDER = "NASA's Scientific Visualization Studio";
export const svsPage = (id: number) => `https://svs.gsfc.nasa.gov/${id}/`;

interface CreditInputs {
  freshness: FreshnessFile;
  official: OfficialIndex;
  related: OfficialIndex;
}

function splitProvider(d: Pick<DatasetRef, "id" | "name" | "agency" | "provider">): { name: string; provider: string } {
  if (FRAME.test(d.id)) return { name: d.name, provider: SVS_PROVIDER };
  if (d.provider) return { name: d.name, provider: d.provider };
  const m = /^(.*?)\s*\(([^()]*)\)$/u.exec(d.name);
  return m ? { name: m[1], provider: m[2].replace(/^via /u, "") } : { name: d.name, provider: d.agency };
}

type Plays = Map<string, Set<CreditPage>>;

function add(plays: Plays, product: string | undefined, page: CreditPage) {
  if (!product) return;
  if (!plays.has(product)) plays.set(product, new Set());
  plays.get(product)?.add(page);
}

function officialRows(inputs: CreditInputs): { row: OfficialIndexRow; output: string }[] {
  return [
    ...inputs.official.records.map((row) => ({ row, output: `official/${row.manifest}` })),
    ...inputs.related.records.map((row) => ({ row, output: `related/${row.manifest}` })),
  ];
}

function playedProducts(inputs: CreditInputs): Plays {
  const plays: Plays = new Map();
  for (const s of SURFACES) {
    for (const v of s.voices) add(plays, voiceProduct(v), s.page);
    for (const p of [...(s.products ?? []), ...(s.shows ?? [])]) add(plays, p, s.page);
  }
  for (const row of inputs.official.records) for (const p of appProducts(row)) add(plays, p, "official");
  const outputs = new Set(officialRows(inputs).map((r) => r.output));
  for (const e of Object.values(inputs.freshness.products)) {
    if (!outputs.has(e.outputs[0])) continue;
    add(plays, e.product, "official");
    add(plays, e.product, "braille");
  }
  return plays;
}

const live = (e: FreshnessEntry | undefined): e is FreshnessEntry => !!e && e.status !== "missing";
const ordered = (pages: Iterable<CreditPage>) => CREDIT_PAGES.filter((p) => new Set(pages).has(p));

interface Acc {
  entry: Omit<CreditEntry, "pages" | "records">;
  pages: Set<CreditPage>;
  records: Set<string>;
}

function accumulate(map: Map<string, Acc>, key: string, entry: Acc["entry"], record: string, pages: Iterable<CreditPage>) {
  const acc = map.get(key) ?? { entry, pages: new Set<CreditPage>(), records: new Set<string>() };
  for (const p of pages) acc.pages.add(p);
  acc.records.add(record);
  map.set(key, acc);
}

const finish = (map: Map<string, Acc>): CreditEntry[] =>
  [...map.values()].map((a) => ({ ...a.entry, pages: ordered(a.pages), records: [...a.records] }));

function playedDatasets(e: FreshnessEntry, byId: Map<string, DatasetRef>): DatasetRef[] {
  const checks = new Set(e.checked_against ?? []);
  const own = e.datasets.filter((d) => !checks.has(d.id));
  const inputs = own.filter((d) => FRAME.test(d.id)).flatMap((d) => d.shares_inputs_with.map((id) => byId.get(id)));
  return [...own, ...inputs].filter((d): d is DatasetRef => !!d && !checks.has(d.id));
}

function svsOf(e: FreshnessEntry, rows: Map<string, OfficialIndexRow>): { ids: number[]; title: string } | null {
  const row = rows.get(e.product);
  if (row) return row.svs_ids.length ? { ids: row.svs_ids, title: row.title } : null;
  const frame = e.datasets.find((d) => SVS_ID.test(d.id));
  return frame ? { ids: [Number(SVS_ID.exec(frame.id)?.[1])], title: frame.name } : null;
}

export function buildCredits(inputs: CreditInputs): CreditsList {
  const plays = playedProducts(inputs);
  const entries = Object.values(inputs.freshness.products).filter(live);
  const byId = new Map(entries.flatMap((e) => e.datasets.map((d) => [d.id, d] as const)));
  const rows = new Map(officialRows(inputs).map(({ row }) => [row.record, row]));
  const groups = new Map<CreditGroup, Map<string, Acc>>(CREDIT_GROUPS.map((g) => [g, new Map()]));
  const played = new Set<string>();

  for (const e of entries) {
    const pages = plays.get(e.product);
    if (!pages) continue;
    for (const d of playedDatasets(e, byId)) {
      played.add(d.id);
      if (FRAME.test(d.id)) continue;
      const group: CreditGroup = d.kind === "measurement" ? "observations" : "models";
      accumulate(groups.get(group) ?? new Map(), d.id, { id: d.id, ...splitProvider(d), link: d.url ?? null }, e.product, pages);
    }
    const svs = svsOf(e, rows);
    if (svs) {
      const key = svs.ids.join(",");
      const entry = { id: key, name: svs.title, provider: `${SVS_PROVIDER} (SVS ${svs.ids.join(", ")})`, link: svsPage(svs.ids[0]) };
      accumulate(groups.get("svs") ?? new Map(), key, entry, e.product, pages);
    }
  }

  const testing = new Map<string, Acc>();
  for (const e of entries) {
    for (const d of e.datasets) {
      if (played.has(d.id) || PLACEHOLDER.test(d.id)) continue;
      accumulate(testing, d.id, { id: d.id, ...splitProvider(d), link: d.url ?? null }, e.product, []);
    }
  }

  const data = Object.fromEntries(CREDIT_GROUPS.map((g) => [g, finish(groups.get(g) ?? new Map())])) as Record<CreditGroup, CreditEntry[]>;
  return { data, testing: finish(testing) };
}
