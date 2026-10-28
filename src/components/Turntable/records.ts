// The records on the carousel. The live records are the app's track modes, so
// choosing a record is choosing a track: the mixer, frame labels and readout
// follow exactly as they do on the flat map.

import type { TrackMode, VoiceId } from "@/lib/audio-adapter/types";
import type { LiveFields } from "@/lib/data";
import { voiceSpec } from "@/lib/audio/mapping";
import type { BoundT, MessageKey } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { datasetName } from "@/lib/whisper";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";

export const LIVE_RECORDS = ["ocean", "rain", "both"] as const satisfies readonly TrackMode[];

/** EIC areas without a record yet: shown, locked, with no data and no sound. */
export const COMING_RECORDS = ["air", "forests", "fire", "energy", "seaLevel", "disasters", "agriculture", "water", "ghg"] as const;
export type ComingRecord = (typeof COMING_RECORDS)[number];

/** The legend a record's range bar uses (its frame's own range). */
export interface RecordLegend {
  unit: string;
  range: [number, number];
  scale: "linear" | "log";
}

/**
 * What a new record needs to go live, in one entry: its L1 grid (loaded into a
 * lookup with valueAt semantics: null = no data → silence), the mapping.json
 * voice that plays it, its legend and the display image drawn on the globe.
 */
export interface RecordPlugin {
  load(): Promise<(lat: number, lon: number) => number | null>;
  voice: VoiceId;
  legend: RecordLegend;
  image: string;
}

/** One named place a place record plays (a pipeline file's point or series value). */
export interface PlacePin {
  id: string;
  lat: number;
  lon: number;
  label: string;
  value: number | null; // null = no measurement there → the neutral no-data texture
}

/**
 * §15: a record built from named places (point series, e.g. SWOT reaches, night-light cities)
 * instead of a global grid. Its pins sit on the globe; the needle plays the pin it is on with
 * the voice's mapping.json rule; off a pin is honest silence. `product` names its
 * meta/freshness.json entry, which the sleeve back reads (datasets, badges, age, check).
 */
export interface PlaceRecordPlugin {
  kind: "place";
  load(): Promise<PlacePin[]>;
  voice: string; // a mapping.json voice id
  legend: RecordLegend;
  product: string;
}

export type AnyRecordPlugin = (RecordPlugin & { kind?: "grid" }) | PlaceRecordPlugin;

/**
 * TODO(turntable: more records): one live record per EIC area. Each entry stays
 * null until L1 publishes the grid (or the place file) + metadata and L2 adds the voice to mapping.json.
 */
export const RECORD_PLUGINS: Record<ComingRecord, AnyRecordPlugin | null> = {
  air: null,
  forests: null,
  fire: null,
  energy: null,
  seaLevel: null,
  disasters: null,
  agriculture: null,
  water: null,
  ghg: null,
};

export const RECORD_LABELS = {
  ocean: "turntable.record.ocean",
  rain: "turntable.record.rain",
  both: "turntable.record.both",
  air: "turntable.record.air",
  forests: "turntable.record.forests",
  fire: "turntable.record.fire",
  energy: "turntable.record.energy",
  seaLevel: "turntable.record.seaLevel",
  disasters: "turntable.record.disasters",
  agriculture: "turntable.record.agriculture",
  water: "turntable.record.water",
  ghg: "turntable.record.ghg",
} as const satisfies Record<TrackMode | ComingRecord, MessageKey>;

export function stepRecord(track: TrackMode, step: 1 | -1): TrackMode {
  const i = LIVE_RECORDS.indexOf(track);
  return LIVE_RECORDS[(i + step + LIVE_RECORDS.length) % LIVE_RECORDS.length];
}

export const FRAME_PRODUCT_LABELS = {
  ocean: "frame.product.ocean",
  rain: "frame.product.rain",
} as const satisfies Record<RecordFrame["product"], MessageKey>;

/** One EIC frame a record plays, with the metadata its label is read from. */
export type RecordFrame = { product: "ocean"; meta: SstMetadata } | { product: "rain"; meta: RainMetadata };

/** The frames a record plays; rain is missing until it has loaded. */
export function recordFrames(track: TrackMode, fields: LiveFields | null): RecordFrame[] {
  const frames: RecordFrame[] = [];
  if (fields && track !== "rain") frames.push({ product: "ocean", meta: fields.sst.meta });
  if (fields?.rain && track !== "ocean") frames.push({ product: "rain", meta: fields.rain.meta });
  return frames;
}

/** The measured error as the Truth panel shows it: ocean has no number until its re-check (contract-proposals §A1). */
export function measuredError(t: BoundT, frame: RecordFrame): string {
  if (frame.product === "ocean") {
    const truth = oceanTruth(frame.meta);
    return truth ? t("turntable.error.ocean", truth) : t("truth.ocean.updating");
  }
  const percent = rainTruth(frame.meta).percent;
  return Number.isFinite(percent) ? t("turntable.error.rain", { percent }) : t("turntable.missing");
}

/** The meta/freshness.json product a frame belongs to (its voice's source.product in mapping.json). */
export function frameProduct(frame: RecordFrame): string | undefined {
  return voiceSpec(frame.product).source.product;
}

/** The dataset name and SVS ID, as the metadata gives them. */
export function frameSource(t: BoundT, frame: RecordFrame): { dataset: string; svs: string } {
  const { meta } = frame;
  return {
    dataset: meta.source_dataset ? datasetName(meta) : t("turntable.missing"),
    svs: Number.isFinite(meta.svs_id) ? t("provenance.svs", { id: meta.svs_id }) : t("turntable.missing"),
  };
}
