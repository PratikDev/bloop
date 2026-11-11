import { channelReading, type OfficialRecordState } from "@/components/OfficialRecords/use-official-record";
import { continuousRule } from "@/lib/audio/mapping";
import { followStorm, loadOfficialLayer, loadOfficialManifest, loadSequence, valueAt, type LiveFields, type OfficialGrid } from "@/lib/data";
import { loadLifetime } from "../lifetime/load";
import { seriesOf } from "../lifetime/song";
import type { ClimateCellName } from "@/types/data-contract";
import { dropPlan, pitchPlan, type ProofPlan } from "./plan";

export const PROOF_RECORDS = ["ocean", "rain", "currents_3912", "heat", "monsoon", "water"] as const;
type ProofRecord = (typeof PROOF_RECORDS)[number];

const MAX_STEPS = 24;
const CURSOR_STEP_SEC = 0.4;
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
