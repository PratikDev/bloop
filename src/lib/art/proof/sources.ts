// The plans the data-voice check renders, from data the app already ships: live SST (MUR, Listen's ocean voice) along
// a row of the Bay of Bengal, IMERG rain at the storm the time-lapse follows (48 half-hourly frames), and SVS 3912's
// SST at its start point through time; Then vs Now's three voices on the first city's yearly series (lifetime.json:
// GISTEMP heat, GPCP monsoon rain, GRACE water). An Official record's own plan: its first channel at the needle
// through time.

import { channelReading, type OfficialRecordState } from "@/components/OfficialRecords/use-official-record";
import { continuousRule } from "@/lib/audio/mapping";
import { followStorm, loadOfficialLayer, loadOfficialManifest, loadSequence, valueAt, type LiveFields, type OfficialGrid } from "@/lib/data";
import { loadLifetime } from "../lifetime/load";
import { seriesOf } from "../lifetime/song";
import type { ClimateCellName } from "@/types/data-contract";
import { dropPlan, pitchPlan, type ProofPlan } from "./plan";

/** The CI records: live SST, IMERG rain, SVS 3912, and Then vs Now's heat, monsoon and water voices. */
export const PROOF_RECORDS = ["ocean", "rain", "currents_3912", "heat", "monsoon", "water"] as const;
type ProofRecord = (typeof PROOF_RECORDS)[number];

const MAX_STEPS = 24;
/** A cursor's pace on the map (s per value): slow enough for Music's meend to settle. */
const CURSOR_STEP_SEC = 0.4;
/** The Bay of Bengal row the ocean plan reads (15° N, 81° E eastward, half a degree apart). */
const BAY_ROW = { lat: 15, lon: 81, stepDeg: 0.5 };

function oceanPlan(fields: LiveFields): ProofPlan {
  const values = Array.from({ length: MAX_STEPS }, (_, i) => valueAt(fields, "ocean", BAY_ROW.lat, BAY_ROW.lon + i * BAY_ROW.stepDeg).valueC);
  return pitchPlan("ocean", "ocean", values, CURSOR_STEP_SEC);
}

async function rainPlan(): Promise<ProofPlan> {
  const points = followStorm(await loadSequence());
  return dropPlan("rain", "rain", points.map((p) => p.mmPerHour), 0.5);
}

async function currentsPlan(): Promise<ProofPlan> {
  const m = await loadOfficialManifest("currents_3912");
  const option = m.play[0];
  const layer = m.layers.find((l) => l.id === "sst");
  if (!layer || !option) throw new Error("currents_3912: no sst layer");
  const grid = await loadOfficialLayer(m.record, layer);
  const at = option.start;
  const steps = Math.min(MAX_STEPS, grid.steps.length);
  const values = Array.from({ length: steps }, (_, t) => channelReading({ sst: grid }, ["sst"], "value", t, at)?.value ?? null);
  return pitchPlan("currents_3912", "ocean", values, 1 / option.steps_per_second);
}

/** A Then vs Now voice on the first city's yearly series (the latest years), at the cursor's pace. */
async function thenNowPlan(voice: "heat" | "monsoon" | "water"): Promise<ProofPlan> {
  const f = await loadLifetime();
  const city = Object.keys(f.cities)[0] as ClimateCellName;
  const values = seriesOf(f, city, voice === "monsoon" ? "rain" : voice).values.slice(-MAX_STEPS);
  return voice === "monsoon" ? dropPlan(voice, voice, values, CURSOR_STEP_SEC) : pitchPlan(voice, voice, values, CURSOR_STEP_SEC);
}

export async function proofPlan(record: ProofRecord, fields: LiveFields | null): Promise<ProofPlan | null> {
  if (record === "ocean") return fields ? oceanPlan(fields) : null;
  if (record === "heat" || record === "monsoon" || record === "water") return thenNowPlan(record);
  return record === "rain" ? rainPlan() : currentsPlan();
}

/** An Official record's plan: its first channel's values at the needle through time, at the record's own tempo. */
export function recordPlan(rec: OfficialRecordState): ProofPlan | null {
  const channel = rec.option?.channels[0];
  if (!rec.option || !channel || !rec.ready || !rec.manifest) return null;
  const grids: Record<string, OfficialGrid> = rec.grids;
  const steps = Math.min(MAX_STEPS, rec.steps);
  const values = Array.from({ length: steps }, (_, t) => channelReading(grids, channel.layers, channel.combine, t, rec.needle)?.value ?? null);
  const stepSec = Math.max(CURSOR_STEP_SEC, 1 / rec.option.steps_per_second);
  const param = continuousRule(channel.voice).output.param;
  if (param === "frequency") return pitchPlan(rec.manifest.record, channel.voice, values, stepSec);
  return null;
}
