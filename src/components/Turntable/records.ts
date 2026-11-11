// The records on the carousel. The live records are the app's track modes, so
// choosing a record is choosing a track: the mixer, frame labels and readout
// follow exactly as they do on the flat map.

import type { TrackMode } from "@/lib/audio-jukebox/types";
import type { LiveFields } from "@/lib/data";
import { voiceSpec } from "@/lib/audio/mapping";
import type { BoundT, MessageKey } from "@/lib/i18n";
import { oceanTruth, rainTruth } from "@/lib/truth";
import { datasetName } from "@/lib/whisper";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";

export const LIVE_RECORDS = ["ocean", "rain", "both"] as const satisfies readonly TrackMode[];

/** EIC areas without a record yet: shown, locked, with no data and no sound. */
export const COMING_RECORDS = ["air", "forests", "fire", "energy", "seaLevel", "disasters", "agriculture", "water", "ghg"] as const;
type ComingRecord = (typeof COMING_RECORDS)[number];

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
    return truth ? t("turntable.error.ocean", { median: truth.median, n: truth.points }) : t("truth.ocean.updating");
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
