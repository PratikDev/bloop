import { fetchJson } from "@/lib/data/fetch";
import { en, type MessageKey, type Messages } from "@/lib/i18n";
import { FLAGS } from "@/lib/flags";
import type { FirmsContextFile, FwiClassMetadata, LandslideClassMetadata, NightLightsFile, OfficialIndex, OfficialIndexRow } from "@/types/data-contract";
import { DATA_PATHS } from "@/lib/data/paths";
import { EARTH_PATHS } from "./paths";
import { RADAR_APPLIED_VOICE, RADAR_RECORD } from "./radar";

type TitleKey = { [K in MessageKey]: Messages[K] extends string ? K : never }[MessageKey];

export const APP_RECORD_IDS = ["fires_fwi", "landslide_lhasa", "nightlights_bm"] as const;
export type AppRecordId = (typeof APP_RECORD_IDS)[number];

interface AppRecordSpec {
  id: AppRecordId;
  products: readonly string[];
  titleKey: TitleKey;
  enabled: () => boolean;
}

export const APP_RECORDS: Record<AppRecordId, AppRecordSpec> = {
  fires_fwi: { id: "fires_fwi", products: ["fwi_class", "fwi_archive", "firms_daily", "fires_frame"], titleKey: "earth.fire.title", enabled: () => FLAGS.dataWildfires },
  landslide_lhasa: { id: "landslide_lhasa", products: ["landslide_class"], titleKey: "earth.slide.title", enabled: () => FLAGS.dataLandslides },
  nightlights_bm: { id: "nightlights_bm", products: ["nightlights"], titleKey: "earth.lights.title", enabled: () => FLAGS.dataNightLights },
};

export const isAppRecord = (record: string): record is AppRecordId => (APP_RECORD_IDS as readonly string[]).includes(record);

interface AppIndexRow extends OfficialIndexRow {
  products: readonly string[];
}

export const appProducts = (row: OfficialIndexRow): readonly string[] => ("products" in row ? (row as AppIndexRow).products : []);

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const span = (a: string, b: string) => (a === b ? a : `${a} – ${b}`);

async function appIndexRows(enabled: (s: AppRecordSpec) => boolean = (s) => s.enabled()): Promise<AppIndexRow[]> {
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

export const METHOD_APPLIED_TO: Readonly<Record<string, string>> = { [RADAR_RECORD]: RADAR_APPLIED_VOICE };

const isMethodRow = (row: OfficialIndexRow): boolean => "kind" in row && (row as { kind?: string }).kind === "method";

export async function withAppRecords(index: OfficialIndex): Promise<OfficialIndex> {
  const extra = await appIndexRows().catch(() => []);
  return { records: [...index.records.filter((r) => FLAGS.dataRadar || !isMethodRow(r)), ...extra] };
}
