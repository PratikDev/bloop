// PURE: the raw-pixel demo's two renders of one frame (SVS 3912's sea surface temperature, its first frame), as sample
// arrays, so the app plays exactly what was measured. Both walk the same path: the frame row by row (north to south,
// west to east), on a 4×4-pixel grid. The naive version turns each pixel's colour hue into a pitch, pixel after pixel
// (what a direct pixel-to-sound translation does); Bloop's plays the same path at its sweep speed through the real
// values and the ocean rule, silent where there is no data. Naive is shown for comparison only: Bloop never plays it.

import { continuousRule, mapContinuous } from "@/lib/audio/mapping";

export const RAW_RATE = 22050;
export const RAW_SECONDS = 6;
/** The path's grid: every 4th pixel of the 360×180 frame. */
const RAW_STRIDE = 4;
const NAIVE_MIN_HZ = 100;
const NAIVE_MAX_HZ = 4000;
const AMP = 0.3;
/** Bloop's sweep step (the app's sweep: 80 ms). */
const BLOOP_STEP_SEC = 0.08;

export interface Frame {
  width: number;
  height: number;
  /** Row-major values, row 0 = north; null = no data (land). */
  values: (number | null)[];
  /** The colorbar the frame was drawn with (layer.display). */
  colours: string[];
  stops: number[];
}

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Hue (0–360) of an RGB colour; grey and black (the frame's land) have hue 0. */
export function hue([r, g, b]: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** A pixel's colour as the frame drew it: the colorbar colour nearest its value; land is black. */
function pixelColour(f: Frame, v: number | null): Rgb {
  if (v === null) return [0, 0, 0];
  let best = 0;
  for (let i = 1; i < f.stops.length; i++) if (Math.abs(f.stops[i] - v) < Math.abs(f.stops[best] - v)) best = i;
  return hex(f.colours[best]);
}

/** The path: pixels on the stride grid, row by row. */
export function path(f: Frame): (number | null)[] {
  const out: (number | null)[] = [];
  for (let y = 0; y < f.height; y += RAW_STRIDE) for (let x = 0; x < f.width; x += RAW_STRIDE) out.push(f.values[y * f.width + x]);
  return out;
}

/** The naive render: each pixel's hue → a pitch (100–4000 Hz), one after another, over 6 s. */
export function renderNaive(f: Frame): Float32Array {
  const px = path(f);
  const out = new Float32Array(RAW_RATE * RAW_SECONDS);
  const per = out.length / px.length;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const h = hue(pixelColour(f, px[Math.min(px.length - 1, Math.floor(i / per))]));
    phase += (2 * Math.PI * (NAIVE_MIN_HZ + (h / 360) * (NAIVE_MAX_HZ - NAIVE_MIN_HZ))) / RAW_RATE;
    out[i] = AMP * Math.sin(phase);
  }
  return out;
}

/** Bloop's render: the same path, in sweep steps (each the mean of its pixels' values), through the ocean rule with
 *  its 30 ms glide and fades; no data is silence. */
export function renderBloop(f: Frame): Float32Array {
  const px = path(f);
  const rule = continuousRule("ocean");
  const steps = Math.round(RAW_SECONDS / BLOOP_STEP_SEC);
  const per = px.length / steps;
  const targets = Array.from({ length: steps }, (_, s) => {
    const vals = px.slice(Math.floor(s * per), Math.floor((s + 1) * per)).filter((v): v is number => v !== null);
    return vals.length ? mapContinuous(vals.reduce((a, b) => a + b, 0) / vals.length, rule) : null;
  });
  const out = new Float32Array(RAW_RATE * RAW_SECONDS);
  const glide = 1 - Math.exp(-1 / (0.01 * RAW_RATE)); // setTargetAtTime with a 10 ms constant (a 30 ms glide)
  const fade = 1 - Math.exp(-1 / (0.007 * RAW_RATE));
  let hz = targets.find((t) => t !== null) ?? 440;
  let amp = 0;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const target = targets[Math.min(steps - 1, Math.floor(i / (BLOOP_STEP_SEC * RAW_RATE)))];
    if (target !== null) hz += (target - hz) * glide;
    amp += ((target === null ? 0 : AMP) - amp) * fade;
    phase += (2 * Math.PI * hz) / RAW_RATE;
    out[i] = amp * Math.sin(phase);
  }
  return out;
}
