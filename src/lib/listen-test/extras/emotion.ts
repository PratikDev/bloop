import { counterbalance, type ExtraRecord, type ExtraTaskInfo } from "./types";

export const EMOTION: ExtraTaskInfo = { id: "emotion", seconds: 75 };
export const SCALE = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof SCALE)[number];
type Condition = "sound" | "visual";

export interface Clip {
  values: number[];
  lats: number[];
  lons: number[];
  stepMs: number;
}

const CLIP_STEP_MS = 300;

export function emotionClip(points: readonly { lat: number; lon: number; frame: number }[]): Clip {
  const sorted = [...points].sort((a, b) => a.lon - b.lon).slice(0, 20);
  return { values: sorted.map((p) => p.frame), lats: sorted.map((p) => p.lat), lons: sorted.map((p) => p.lon), stepMs: CLIP_STEP_MS };
}

export const emotionOrder = (coin: number): [Condition, Condition] => counterbalance<Condition>("sound", "visual", coin);

export interface EmotionRecord extends ExtraRecord {
  condition: Condition;
  position: number;
  valence: Rating;
  connection: Rating;
}

export const isRating = (v: number): v is Rating => (SCALE as readonly number[]).includes(v);
