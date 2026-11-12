// PURE: the raw-pixel demo's measurements (docs/statement/ART.md). Short-time spectra: 2048-sample Hann frames, hop
// 1024; silent frames (RMS under 1e-4) are skipped, so Bloop's honest silence over land isn't counted as anything.
//   spectral flatness: geometric mean / arithmetic mean of the power spectrum (0 = a pure tone, 1 = white noise);
//   spectral entropy: Shannon entropy of the normalised power spectrum, divided by log(bins) (0 = one bin, 1 = flat);
//   roughness: Sethares' (1993) parametrisation of the Plomp–Levelt curve, summed over every pair of the frame's 20
//     strongest spectral peaks: a1·a2·(e^(−3.5·s·Δf) − e^(−5.75·s·Δf)), s = 0.24 / (0.0207·f_min + 18.96).
// Each is the mean over the frames that sound.

export const FRAME = 2048;
const HOP = 1024;
const SILENT_RMS = 1e-4;
const PEAKS = 20;

/** In-place radix-2 FFT (re, im of length a power of two). */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const a = i + k;
        const b = a + len / 2;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
    }
  }
}

/** The power spectrum (bins 1 … N/2 − 1) of each sounding frame. */
export function spectra(x: Float32Array): Float64Array[] {
  const out: Float64Array[] = [];
  for (let start = 0; start + FRAME <= x.length; start += HOP) {
    let rms = 0;
    for (let i = 0; i < FRAME; i++) rms += x[start + i] ** 2;
    if (Math.sqrt(rms / FRAME) < SILENT_RMS) continue;
    const re = new Float64Array(FRAME);
    const im = new Float64Array(FRAME);
    for (let i = 0; i < FRAME; i++) re[i] = x[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1)));
    fft(re, im);
    const p = new Float64Array(FRAME / 2 - 1);
    for (let k = 1; k < FRAME / 2; k++) p[k - 1] = re[k] ** 2 + im[k] ** 2 + 1e-20;
    out.push(p);
  }
  return out;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function flatness(p: Float64Array): number {
  let logSum = 0;
  let sum = 0;
  for (const v of p) {
    logSum += Math.log(v);
    sum += v;
  }
  return Math.exp(logSum / p.length) / (sum / p.length);
}

export function entropy(p: Float64Array): number {
  let sum = 0;
  for (const v of p) sum += v;
  let h = 0;
  for (const v of p) {
    const q = v / sum;
    if (q > 0) h -= q * Math.log(q);
  }
  return h / Math.log(p.length);
}

/** Sethares' dissonance of one pair of partials (Hz, linear amplitude). */
export function pairRoughness(f1: number, f2: number, a1: number, a2: number): number {
  const s = 0.24 / (0.0207 * Math.min(f1, f2) + 18.96);
  const d = Math.abs(f2 - f1);
  return a1 * a2 * (Math.exp(-3.5 * s * d) - Math.exp(-5.75 * s * d));
}

/** Roughness of one frame: its strongest local maxima (magnitude), every pair. */
export function roughness(p: Float64Array, sampleRate: number): number {
  const mag = Array.from(p, (v) => Math.sqrt(v));
  const peaks: { f: number; a: number }[] = [];
  for (let k = 1; k < mag.length - 1; k++) if (mag[k] > mag[k - 1] && mag[k] >= mag[k + 1]) peaks.push({ f: ((k + 1) * sampleRate) / FRAME, a: mag[k] });
  peaks.sort((x, y) => y.a - x.a);
  const top = peaks.slice(0, PEAKS);
  const norm = top[0]?.a ?? 1;
  let r = 0;
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) r += pairRoughness(top[i].f, top[j].f, top[i].a / norm, top[j].a / norm);
  return r;
}

export interface Measures {
  flatness: number;
  entropy: number;
  roughness: number;
  frames: number;
}

export function measure(x: Float32Array, sampleRate: number): Measures {
  const ps = spectra(x);
  return {
    flatness: mean(ps.map(flatness)),
    entropy: mean(ps.map(entropy)),
    roughness: mean(ps.map((p) => roughness(p, sampleRate))),
    frames: ps.length,
  };
}

/** Rounded as stored and shown (4 significant figures). */
export const stored = (m: Measures): Measures => ({
  flatness: Number(m.flatness.toPrecision(4)),
  entropy: Number(m.entropy.toPrecision(4)),
  roughness: Number(m.roughness.toPrecision(4)),
  frames: m.frames,
});
