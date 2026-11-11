import { counterbalance, type ExtraRecord, type ExtraTaskInfo } from "./types";

export const EAR_EYE: ExtraTaskInfo = { id: "earEye", seconds: 60 };
export const PEAK_OPTIONS = ["early", "middle", "late"] as const;
export type PeakOption = (typeof PEAK_OPTIONS)[number];
type Sense = "sound" | "picture";
export const STEP_MS = 250;

interface EarEyeItem {
  half: 0 | 1;
  sense: Sense;
  values: (number | null)[];
  lats: number[];
  lons: number[];
  correct: PeakOption;
}

function peakThird(values: readonly (number | null)[]): PeakOption | null {
  let best = -1;
  let at = -1;
  values.forEach((v, i) => {
    if (v !== null && v > best) {
      best = v;
      at = i;
    }
  });
  if (best <= 0) return null;
  return PEAK_OPTIONS[Math.min(2, Math.floor((3 * at) / values.length))];
}

export function earEyeItems(points: readonly { lat: number; lon: number; mmPerHour: number | null }[], coinSense: number, coinOrder: number): EarEyeItem[] | null {
  const mid = Math.floor(points.length / 2);
  const halves = [points.slice(0, mid), points.slice(mid)];
  const answers = halves.map((h) => peakThird(h.map((p) => p.mmPerHour)));
  if (answers.some((a) => a === null)) return null;
  const [senseA, senseB] = counterbalance<Sense>("sound", "picture", coinSense);
  const items: EarEyeItem[] = halves.map((h, i) => ({
    half: i === 0 ? 0 : 1,
    sense: i === 0 ? senseA : senseB,
    values: h.map((p) => p.mmPerHour),
    lats: h.map((p) => p.lat),
    lons: h.map((p) => p.lon),
    correct: answers[i] as PeakOption,
  }));
  return counterbalance(items[0], items[1], coinOrder);
}

export interface EarEyeRecord extends ExtraRecord {
  sense: Sense;
  half: number;
  position: number;
  answer: PeakOption;
  correct_answer: PeakOption;
  correct: boolean;
  ms: number;
}
