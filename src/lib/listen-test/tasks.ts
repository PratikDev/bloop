import type { DemoWindow, GlobalPlace, RainPhase, SstTruthPair } from "@/types/data-contract";
import { CV_TASK_IDS, cvTasks, type CvOptionId, type CvSoundPlan, type CvTaskInputs } from "./chord";

export const TASK_IDS = ["ocean", "rain", "unison", "both", "heat", /*  */ ...CV_TASK_IDS /*  */] as const;
export type TaskId = (typeof TASK_IDS)[number];
export type OptionId = "warmer" | "colder" | "first" | "second" | "yes" | "no" /*  */ | CvOptionId /*  */;

interface SweepStep {
  lat: number;
  lon: number;
  valueC: number | null;
  mmPerHour: number | null;
  phase: RainPhase;
}

export type SoundPlan =
  | CvSoundPlan
  | { kind: "tones"; first: number; second: number }
  | { kind: "duets"; first: { frameC: number; fileC: number }; second: { frameC: number; fileC: number } }
  | { kind: "sweep"; steps: SweepStep[]; stepMs: number }
  | { kind: "decades"; first: number[]; second: number[]; labels: [string, string] };

export interface Task {
  id: TaskId;
  params: Record<string, string>;
  options: readonly OptionId[];
  correct: OptionId;
  sound: SoundPlan;
}

interface RainReading {
  mmPerHour: number | null;
  phase: RainPhase;
}

export interface TaskInputs /*  */ extends Partial<CvTaskInputs> /*  */ {
  pairs: readonly SstTruthPair[];
  places: readonly GlobalPlace[];
  rainAt: (lat: number, lon: number) => RainReading;
  heat: { place: string; A: DemoWindow; B: DemoWindow };
}

const RAIN_STEP_MS = 2000;
const BOTH_STEP_MS = 4000;

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const referenceC = (pairs: readonly SstTruthPair[]) => median(pairs.map((p) => p.frame));

function oceanTask(pairs: readonly SstTruthPair[]): Task | null {
  if (!pairs.length) return null;
  const ref = referenceC(pairs);
  const target = pairs.reduce((best, p) => (Math.abs(p.frame - ref) > Math.abs(best.frame - ref) ? p : best));
  if (target.frame === ref) return null;
  return { id: "ocean", params: {}, options: ["warmer", "colder"], correct: target.frame > ref ? "warmer" : "colder", sound: { kind: "tones", first: ref, second: target.frame } };
}

function rainTask(inputs: TaskInputs): Task | null {
  const read = inputs.places.map((place) => ({ place, rain: inputs.rainAt(place.lat, place.lon) }));
  const wet = read.filter((r) => (r.rain.mmPerHour ?? 0) > 0).sort((a, b) => (b.rain.mmPerHour ?? 0) - (a.rain.mmPerHour ?? 0))[0];
  const dry = read.find((r) => r.rain.mmPerHour === 0);
  if (!wet || !dry) return null;
  const [first, second] = inputs.places.indexOf(wet.place) < inputs.places.indexOf(dry.place) ? [wet, dry] : [dry, wet];
  const step = (r: typeof wet): SweepStep => ({ lat: r.place.lat, lon: r.place.lon, valueC: null, mmPerHour: r.rain.mmPerHour, phase: r.rain.phase });
  return {
    id: "rain",
    params: { a: first.place.name, b: second.place.name },
    options: ["first", "second"],
    correct: first === wet ? "first" : "second",
    sound: { kind: "sweep", steps: [step(first), step(second)], stepMs: RAIN_STEP_MS },
  };
}

function unisonTask(pairs: readonly SstTruthPair[]): Task | null {
  if (pairs.length < 2) return null;
  const err = (p: SstTruthPair) => Math.abs(p.frame - p.file);
  const close = pairs.reduce((a, b) => (err(b) < err(a) ? b : a));
  const far = pairs.reduce((a, b) => (err(b) > err(a) ? b : a));
  if (err(close) === err(far)) return null;
  const [first, second] = pairs.indexOf(close) < pairs.indexOf(far) ? [close, far] : [far, close];
  const duet = (p: SstTruthPair) => ({ frameC: p.frame, fileC: p.file });
  return { id: "unison", params: {}, options: ["first", "second"], correct: first === far ? "first" : "second", sound: { kind: "duets", first: duet(first), second: duet(second) } };
}

function bothTask(inputs: TaskInputs): Task | null {
  const p = inputs.pairs[0];
  if (!p) return null;
  const rain = inputs.rainAt(p.lat, p.lon);
  if (rain.mmPerHour === null) return null;
  return {
    id: "both",
    params: {},
    options: ["yes", "no"],
    correct: rain.mmPerHour > 0 ? "yes" : "no",
    sound: { kind: "sweep", steps: [{ lat: p.lat, lon: p.lon, valueC: p.frame, mmPerHour: rain.mmPerHour, phase: rain.phase }], stepMs: BOTH_STEP_MS },
  };
}

const windowText = (w: DemoWindow) => `${w.window[0]}–${w.window[1]}`;

function heatTask({ heat }: TaskInputs): Task | null {
  if (heat.A.mean === heat.B.mean) return null;
  return {
    id: "heat",
    params: { place: heat.place, a: windowText(heat.A), b: windowText(heat.B) },
    options: ["first", "second"],
    correct: heat.B.mean > heat.A.mean ? "second" : "first",
    sound: { kind: "decades", first: heat.A.values, second: heat.B.values, labels: [windowText(heat.A), windowText(heat.B)] },
  };
}

export function buildTasks(inputs: TaskInputs): Task[] {
  return [
    oceanTask(inputs.pairs),
    rainTask(inputs),
    unisonTask(inputs.pairs),
    bothTask(inputs),
    heatTask(inputs),
    ...cvTasks(inputs),
  ].filter((t): t is Task => t !== null);
}
