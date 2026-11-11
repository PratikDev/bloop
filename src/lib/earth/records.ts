// The records built from the shipped products (DATA): each joins Official records through the record index (as rows of
// loadOfficialIndex, after the pipeline's own), so the shelf, the transcript list and the credits pick them up with no
// list of their own. A row's title and period come from the products' files; only the ids and flags live here.

import { fetchJson } from "@/lib/data/fetch";
import { en, type MessageKey, type Messages } from "@/lib/i18n";
import { FLAGS } from "@/lib/flags";
import type { FirmsContextFile, FwiClassMetadata, LandslideClassMetadata, NightLightsFile, OfficialIndex, OfficialIndexRow } from "@/types/data-contract";
import { DATA_PATHS } from "@/lib/data/paths";
import { EARTH_PATHS } from "./paths";
import { RADAR_APPLIED_VOICE, RADAR_RECORD } from "./radar";

/** A key whose English is plain text (an index title). */
type TitleKey = { [K in MessageKey]: Messages[K] extends string ? K : never }[MessageKey];

export const APP_RECORD_IDS = ["fires_fwi", "landslide_lhasa", "nightlights_bm"] as const;
export type AppRecordId = (typeof APP_RECORD_IDS)[number];

export interface AppRecordSpec {
  id: AppRecordId;
  /** The registry products (meta/freshness.json) the record plays or shows: they move to "Data in this app". */
  products: readonly string[];
  /** Its title (English: index titles are English). Earth Orchestra classifies it from these words
   *  (scripts/orchestra-categories.ts, then getCategory), like every other record. */
  titleKey: TitleKey;
  enabled: () => boolean;
}

export const APP_RECORDS: Record<AppRecordId, AppRecordSpec> = {
  fires_fwi: { id: "fires_fwi", products: ["fwi_class", "fwi_archive", "firms_daily", "fires_frame"], titleKey: "earth.fire.title", enabled: () => FLAGS.dataWildfires },
  landslide_lhasa: { id: "landslide_lhasa", products: ["landslide_class"], titleKey: "earth.slide.title", enabled: () => FLAGS.dataLandslides },
  nightlights_bm: { id: "nightlights_bm", products: ["nightlights"], titleKey: "earth.lights.title", enabled: () => FLAGS.dataNightLights },
};

export const isAppRecord = (record: string): record is AppRecordId => (APP_RECORD_IDS as readonly string[]).includes(record);

/** An index row of an app record: the products it plays (credits read them). */
export interface AppIndexRow extends OfficialIndexRow {
  products: readonly string[];
}

export const appProducts = (row: OfficialIndexRow): readonly string[] => ("products" in row ? (row as AppIndexRow).products : []);

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const span = (a: string, b: string) => (a === b ? a : `${a} – ${b}`);

/** The rows, each from its products' own files (title words from the English table: index titles are English). */
export async function appIndexRows(enabled: (s: AppRecordSpec) => boolean = (s) => s.enabled()): Promise<AppIndexRow[]> {
  const rows: AppIndexRow[] = [];
  if (enabled(APP_RECORDS.fires_fwi)) {
    const [fwi, firms] = await Promise.all([fetchJson<FwiClassMetadata>(EARTH_PATHS.fwiMeta), fetchJson<FirmsContextFile>(DATA_PATHS.firms)]);
    const days = firms.daily ? Object.values(firms.daily.series).flatMap((s) => s?.days ?? []).sort() : [];
    rows.push({
      record: "fires_fwi",
      title: en[APP_RECORDS.fires_fwi.titleKey],
      svs_ids: [fwi.svs_id],
      badge: "observation",
      period: span(days[0] ?? day(fwi.frame_time_utc), day(fwi.frame_time_utc)),
      manifest: "app:fires_fwi",
      products: APP_RECORDS.fires_fwi.products,
    });
  }
  if (enabled(APP_RECORDS.landslide_lhasa)) {
    const m = await fetchJson<LandslideClassMetadata>(EARTH_PATHS.landslideMeta);
    rows.push({ record: "landslide_lhasa", title: en[APP_RECORDS.landslide_lhasa.titleKey], svs_ids: [m.svs_id], badge: "model", period: day(m.frame_time_utc), manifest: "app:landslide_lhasa", products: APP_RECORDS.landslide_lhasa.products });
  }
  if (enabled(APP_RECORDS.nightlights_bm)) {
    const n = await fetchJson<NightLightsFile>(EARTH_PATHS.nightLights);
    const days = Object.values(n.cities).flatMap((c) => c.days).sort();
    rows.push({ record: "nightlights_bm", title: en[APP_RECORDS.nightlights_bm.titleKey], svs_ids: [], badge: "observation", period: span(days[0] ?? "", days[days.length - 1] ?? ""), manifest: "app:nightlights_bm", products: APP_RECORDS.nightlights_bm.products });
  }
  return rows;
}

/** Method records play NASA's method on another voice's data, and take that voice's Earth Orchestra category
 *  (scripts/orchestra-categories.ts, orchestra.test.ts). */
export const METHOD_APPLIED_TO: Readonly<Record<string, string>> = { [RADAR_RECORD]: RADAR_APPLIED_VOICE };

/** A pipeline row for a method record (SVS 13786: no layers; the app plays NASA's method on an Earth frame). */
export const isMethodRow = (row: OfficialIndexRow): boolean => "kind" in row && (row as { kind?: string }).kind === "method";

/** The index with the app records after the pipeline's rows (a failed product load leaves the index as it was). A
 *  method row is listed only with its flag (P5): without it the record has nothing to play. */
export async function withAppRecords(index: OfficialIndex): Promise<OfficialIndex> {
  const extra = await appIndexRows().catch(() => []);
  return { records: [...index.records.filter((r) => FLAGS.dataRadar || !isMethodRow(r)), ...extra] };
}
