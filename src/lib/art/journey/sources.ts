// Water's journey's data, from files the app already ships (each checked to exist and play; a step whose data won't
// load is left out, never faked): SVS 5011 lightning at Dhaka (its play start), SVS 4960's river at its play start (the
// picture's own view), the storm the time-lapse follows (IMERG), GRACE over Bangladesh (yearly means), and the Bay of
// Bengal's sea surface along 15° N (MUR, the live frame).

import { followStorm, loadOfficialLayer, loadOfficialManifest, loadSequence, officialValueAt, valueAt, type LiveFields } from "@/lib/data";
import { fetchJson } from "@/lib/data/fetch";
import type { LifetimeFile } from "../lifetime/song";
import type { JourneySource } from "./plan";

const STEPS = 24;
/** The Bay of Bengal row the last step reads (the same as the data-voice check's). */
export const BAY = { lat: 15, lon: 81, stepDeg: 0.5 };

const day = (iso: string) => iso.slice(0, 10);

async function officialSource(id: "lightning" | "river", recordId: string, voiceId: string, stepSec: number): Promise<JourneySource> {
  const m = await loadOfficialManifest(recordId);
  const option = m.play[0];
  const layer = m.layers.find((l) => l.id === option.map);
  if (!layer) throw new Error(`${recordId}: no map layer`);
  const grid = await loadOfficialLayer(m.record, layer);
  const first = Math.max(0, grid.steps.length - STEPS); // the most recent windows
  const steps = Array.from({ length: grid.steps.length - first }, (_, k) => first + k);
  return {
    id,
    recordId,
    voiceId,
    values: steps.map((t) => officialValueAt(grid, t, option.start.lat, option.start.lon)?.value ?? null),
    stepSec,
    dataset: m.credit_line ?? m.title,
    period: `${day(layer.times[first])} to ${day(layer.times[layer.times.length - 1])}`,
    status: layer.status,
  };
}

async function rainSource(): Promise<JourneySource> {
  const seq = await loadSequence();
  const pts = followStorm(seq);
  const frames = seq.index.frames;
  return { id: "rain", recordId: "rain", voiceId: "rain", values: pts.map((p) => p.mmPerHour), stepSec: 0.25, dataset: seq.index.credit, period: `${frames[0].time_utc} to ${frames[frames.length - 1].time_utc}`, status: "verified" };
}

async function waterSource(): Promise<JourneySource> {
  const f = await fetchJson<LifetimeFile>("/data/thenvsnow/lifetime.json");
  const w = f.water;
  return { id: "water", recordId: "water", voiceId: "water", values: w.values, stepSec: 0.4, dataset: w.source, period: `${w.years[0]} to ${w.years[w.years.length - 1]}`, status: "observation" };
}

function seaSource(fields: LiveFields): JourneySource {
  const meta = fields.sst.meta;
  const values = Array.from({ length: STEPS }, (_, i) => valueAt(fields, "ocean", BAY.lat, BAY.lon + i * BAY.stepDeg).valueC);
  return { id: "sea", recordId: "ocean", voiceId: "ocean", values, stepSec: 0.4, dataset: meta.source_dataset, period: meta.frame_time_utc, status: "verified" };
}

/** Every step whose data loads, in the suite's order. */
export async function journeySources(fields: LiveFields): Promise<JourneySource[]> {
  const loads: Promise<JourneySource>[] = [
    officialSource("lightning", "lightning_5011", "lightningClicks", 0.3),
    officialSource("river", "river_4960", "riverTransport", 0.4),
    rainSource(),
    waterSource(),
    Promise.resolve(seaSource(fields)),
  ];
  const settled = await Promise.allSettled(loads);
  return settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}
