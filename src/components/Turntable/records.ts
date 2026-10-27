// The records on the carousel. The live records are the app's track modes, so
// choosing a record is choosing a track: the mixer, frame labels and readout
// follow exactly as they do on the flat map.

import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LiveFields } from "@/lib/data";
import type { BoundT, MessageKey } from "@/lib/i18n";
import { rainTruth } from "@/lib/truth";
import { datasetName } from "@/lib/whisper";
import type { RainMetadata, SstMetadata } from "@/types/data-contract";

export const LIVE_RECORDS = ["ocean", "rain", "both"] as const satisfies readonly TrackMode[];

/**
 * EIC areas without a record yet: shown, disabled, with no data and no sound.
 * TODO(turntable: more records): one live record per EIC area. Each needs an
 * L1 grid + metadata, a valueAt track and a voice in mapping.json first.
 */
export const COMING_RECORDS = ["air", "forests", "fire", "energy", "seaLevel", "disasters", "agriculture", "water"] as const;
export type ComingRecord = (typeof COMING_RECORDS)[number];

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

const DAY_MS = 86_400_000;

/** Whole days since the frame time; null if the time doesn't parse. */
export function frameAgeDays(frameTimeUtc: string, now: number): number | null {
  const time = Date.parse(frameTimeUtc);
  return Number.isNaN(time) ? null : Math.floor((now - time) / DAY_MS);
}

/** The measured error as the Truth panel shows it: ocean has no number until its re-check (contract-proposals §A1). */
export function measuredError(t: BoundT, frame: RecordFrame): string {
  if (frame.product === "ocean") return t("truth.ocean.updating");
  const percent = rainTruth(frame.meta).percent;
  return Number.isFinite(percent) ? t("turntable.error.rain", { percent }) : t("turntable.missing");
}

/** The dataset name and SVS ID, as the metadata gives them. */
export function frameSource(t: BoundT, frame: RecordFrame): { dataset: string; svs: string } {
  const { meta } = frame;
  return {
    dataset: meta.source_dataset ? datasetName(meta) : t("turntable.missing"),
    svs: Number.isFinite(meta.svs_id) ? t("provenance.svs", { id: meta.svs_id }) : t("turntable.missing"),
  };
}
