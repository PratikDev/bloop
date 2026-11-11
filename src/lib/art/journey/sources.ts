import { followStorm, loadOfficialLayer, loadOfficialManifest, loadSequence, officialValueAt, valueAt, type LiveFields } from "@/lib/data";
import { classAt } from "@/lib/earth/class-grid";
import { LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { loadLandslide, loadSlidePlaces } from "@/lib/earth/landslide";
import { APP_RECORDS } from "@/lib/earth/records";
import { FLAGS } from "@/lib/flags";
import { loadLifetime } from "../lifetime/load";
import type { JourneySource } from "./plan";

const STEPS = 24;
const JOURNEY_RECORDS = { lightning: "lightning_5011", river: "river_4960" } as const;
export const BAY = { lat: 15, lon: 81, stepDeg: 0.5 };

const day = (iso: string) => iso.slice(0, 10);

async function officialSource(id: "lightning" | "river", recordId: string, voiceId: string, stepSec: number): Promise<JourneySource> {
  const m = await loadOfficialManifest(recordId);
  const option = m.play[0];
  const layer = m.layers.find((l) => l.id === option.map);
  if (!layer) throw new Error(`${recordId}: no map layer`);
  const grid = await loadOfficialLayer(m.record, layer);
  const first = Math.max(0, grid.steps.length - STEPS);
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

async function slopeSource(): Promise<JourneySource> {
  const [grid, places] = await Promise.all([loadLandslide(), loadSlidePlaces()]);
  if (!places.length) throw new Error("no landslide places");
  const m = grid.meta;
  return { id: "slope", recordId: APP_RECORDS.landslide_lhasa.id, voiceId: LANDSLIDE_VOICE, values: places.map((p) => classAt(grid, p.at.lat, p.at.lon)), stepSec: 1.5, dataset: m.credit, period: day(m.frame_time_utc), status: "model" };
}

async function waterSource(): Promise<JourneySource> {
  const f = await loadLifetime();
  const w = f.water;
  return { id: "water", recordId: "water", voiceId: "water", values: w.values, stepSec: 0.4, dataset: w.source, period: `${w.years[0]} to ${w.years[w.years.length - 1]}`, status: "observation" };
}

function seaSource(fields: LiveFields): JourneySource {
  const meta = fields.sst.meta;
  const values = Array.from({ length: STEPS }, (_, i) => valueAt(fields, "ocean", BAY.lat, BAY.lon + i * BAY.stepDeg).valueC);
  return { id: "sea", recordId: "ocean", voiceId: "ocean", values, stepSec: 0.4, dataset: meta.source_dataset, period: meta.frame_time_utc, status: "verified" };
}

export async function journeySources(fields: LiveFields): Promise<JourneySource[]> {
  const loads: Promise<JourneySource>[] = [
    officialSource("lightning", JOURNEY_RECORDS.lightning, "lightningClicks", 0.3),
    officialSource("river", JOURNEY_RECORDS.river, "riverTransport", 0.4),
    rainSource(),
    ...(FLAGS.dataLandslides ? [slopeSource()] : []),
    waterSource(),
    Promise.resolve(seaSource(fields)),
  ];
  const settled = await Promise.allSettled(loads);
  return settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}
