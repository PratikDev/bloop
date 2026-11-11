// PURE: measuring rendered audio for the data-voice check. Pitch: the peak of the Hann-windowed spectrum (a direct
// DTFT) searched finely around the expected frequency: coarse in 1-cent steps over ±40 cents, then 0.02-cent steps,
// then a parabola through the best three. Onsets: rises of a short-window energy envelope.

/** |DTFT| of a Hann-windowed slice at `hz`. */
function magnitudeAt(x: Float32Array, start: number, n: number, sampleRate: number, hz: number): number {
  const w = (2 * Math.PI * hz) / sampleRate;
  let re = 0;
  let im = 0;
  for (let i = 0; i < n; i++) {
    const h = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    const v = x[start + i] * h;
    re += v * Math.cos(w * i);
    im -= v * Math.sin(w * i);
  }
  return Math.hypot(re, im);
}

const cents = (hz: number, c: number) => hz * 2 ** (c / 1200);

/** The frequency of the strongest partial within ±40 cents of `nearHz`, between `from` and `to` (s). */
export function measurePitch(x: Float32Array, sampleRate: number, from: number, to: number, nearHz: number): number {
  const start = Math.max(0, Math.round(from * sampleRate));
  const n = Math.min(x.length - start, Math.round((to - from) * sampleRate));
  const search = (lo: number, hi: number, step: number) => {
    let best = lo;
    let bestMag = -1;
    for (let c = lo; c <= hi + 1e-9; c += step) {
      const m = magnitudeAt(x, start, n, sampleRate, cents(nearHz, c));
      if (m > bestMag) {
        bestMag = m;
        best = c;
      }
    }
    return best;
  };
  const coarse = search(-40, 40, 1);
  const step = 0.02;
  const fine = search(coarse - 1, coarse + 1, step);
  const [a, b, c] = [fine - step, fine, fine + step].map((k) => magnitudeAt(x, start, n, sampleRate, cents(nearHz, k)));
  const denom = a - 2 * b + c;
  const offset = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
  return cents(nearHz, fine + offset * step);
}

/** Onset times (s): where a 5 ms energy envelope jumps above `ratio` × its value 10 ms earlier and above the floor. */
export function onsetTimes(x: Float32Array, sampleRate: number, ratio = 4, floor = 1e-6, holdSec = 0.02): number[] {
  const win = Math.max(1, Math.round(0.005 * sampleRate));
  const frames = Math.floor(x.length / win);
  const energy = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let i = f * win; i < (f + 1) * win; i++) s += x[i] * x[i];
    energy[f] = s / win;
  }
  const out: number[] = [];
  let last = -Infinity;
  for (let f = 2; f < frames; f++) {
    const t = (f * win) / sampleRate;
    if (energy[f] > floor && energy[f] > ratio * energy[f - 2] && t - last > holdSec) {
      out.push(t);
      last = t;
    }
  }
  return out;
}

/** The largest |difference| in cents between two equal-length lists of frequencies. */
export function maxCents(a: readonly number[], b: readonly number[]): number {
  return a.reduce((m, f, i) => Math.max(m, Math.abs(1200 * Math.log2(f / b[i]))), 0);
}
