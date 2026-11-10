// The records built from the shipped products (DATA): each joins Official records through the record index (as rows of
// loadOfficialIndex, after the pipeline's own), so the shelf, the transcript list and the credits pick them up with no
// list of their own. A row's title and period come from the products' files; only the ids and flags live here.

import { fetchJson } from "@/lib/data/fetch";
import type { EarthCategory } from "@/lib/audio/layers/types";
import { en } from "@/lib/i18n";
import { FLAGS } from "@/lib/flags";
import type { FirmsContextFile, FwiClassMetadata, LandslideClassMetadata, NightLightsFile, OfficialIndex, OfficialIndexRow } from "@/types/data-contract";
import { DATA_PATHS } from "@/lib/data/paths";
import { EARTH_PATHS } from "./paths";

export const APP_RECORD_IDS = ["fires_fwi", "landslide_lhasa", "nightlights_bm"] as const;
export type AppRecordId = (typeof APP_RECORD_IDS)[number];

export interface AppRecordSpec {
  id: AppRecordId;
  /** The registry products (meta/freshness.json) the record plays or shows: they move to "Data in this app". */
  products: readonly string[];
  /** Its Earth Orchestra family (HOOK: orchestra; ART's category table at integration). */
  category: EarthCategory;
  enabled: () => boolean;
}

export const APP_RECORDS: Record<AppRecordId, AppRecordSpec> = {
  fires_fwi: { id: "fires_fwi", products: ["fwi_class", "fwi_archive", "firms_daily", "fires_frame"], category: "fire", enabled: () => FLAGS.dataWildfires },
  landslide_lhasa: { id: "landslide_lhasa", products: ["landslide_class"], category: "land", enabled: () => FLAGS.dataLandslides },
  nightlights_bm: { id: "nightlights_bm", products: ["nightlights"], category: "people", enabled: () => FLAGS.dataNightLights },
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
      title: en["earth.fire.title"],
      svs_ids: [fwi.svs_id],
      badge: "observation",
      period: span(days[0] ?? day(fwi.frame_time_utc), day(fwi.frame_time_utc)),
      manifest: "app:fires_fwi",
      products: APP_RECORDS.fires_fwi.products,
    });
  }
  if (enabled(APP_RECORDS.landslide_lhasa)) {
    const m = await fetchJson<LandslideClassMetadata>(EARTH_PATHS.landslideMeta);
    rows.push({ record: "landslide_lhasa", title: en["earth.slide.title"], svs_ids: [m.svs_id], badge: "model", period: day(m.frame_time_utc), manifest: "app:landslide_lhasa", products: APP_RECORDS.landslide_lhasa.products });
  }
  if (enabled(APP_RECORDS.nightlights_bm)) {
    const n = await fetchJson<NightLightsFile>(EARTH_PATHS.nightLights);
    const days = Object.values(n.cities).flatMap((c) => c.days).sort();
    rows.push({ record: "nightlights_bm", title: en["earth.lights.title"], svs_ids: [], badge: "observation", period: span(days[0] ?? "", days[days.length - 1] ?? ""), manifest: "app:nightlights_bm", products: APP_RECORDS.nightlights_bm.products });
  }
  return rows;
}

/** The index with the app records after the pipeline's rows (a failed product load leaves the index as it was). */
export async function withAppRecords(index: OfficialIndex): Promise<OfficialIndex> {
  const extra = await appIndexRows().catch(() => []);
  return { records: [...index.records, ...extra] };
}
