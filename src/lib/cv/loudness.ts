// PURE: the mix pass's meters (docs/audio/MIX.md). Integrated loudness per ITU-R BS.1770-4 (K
// weighting, 400 ms blocks with 75 % overlap, absolute gate −70 LUFS, relative gate −10 LU), true peak by 4× oversampling
// (windowed-sinc interpolation, BS.1770 Annex 2's method), a 2nd-order high-pass (the small-speaker check) and spectral
// flatness (tone vs noise). The filter coefficients come from the standard's analog prototypes, so any sample rate works.

type Biquad = { b: [number, number, number]; a: [number, number, number] };

/** BS.1770's two K-weighting stages at sample rate `fs` (the shelf and the high-pass; pyloudnorm's derivation). */
export function kWeighting(fs: number): Biquad[] {
  const shelf = (() => {
    const G = 3.99984385397, Q = 0.7071752369554193, fc = 1681.974450955533;
    const K = Math.tan((Math.PI * fc) / fs);
    const Vh = 10 ** (G / 20), Vb = Vh ** 0.499666774155;
    const a0 = 1 + K / Q + K * K;
    return { b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] } as Biquad;
  })();
  return [shelf, highpass(fs, 38.13547087613982, 0.5003270373253953)];
}

/** A 2nd-order (RBJ) high-pass at `fc` Hz. */
export function highpass(fs: number, fc: number, Q = Math.SQRT1_2): Biquad {
  const w = (2 * Math.PI * fc) / fs;
  const alpha = Math.sin(w) / (2 * Q);
  const c = Math.cos(w);
  const a0 = 1 + alpha;
  return { b: [(1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0], a: [1, (-2 * c) / a0, (1 - alpha) / a0] };
}

export function filter(x: ArrayLike<number>, f: Biquad): Float64Array {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = f.b[0] * x[i] + f.b[1] * x1 + f.b[2] * x2 - f.a[1] * y1 - f.a[2] * y2;
    [x2, x1, y2, y1] = [x1, x[i], y1, v];
    y[i] = v;
  }
  return y;
}

/** Integrated loudness (LUFS) of 1+ channels (each weight 1: L, R, or mono); −Infinity for silence. */
export function integratedLoudness(channels: readonly ArrayLike<number>[], fs: number): number {
  const k = kWeighting(fs);
  const w = channels.map((ch) => k.reduce<ArrayLike<number>>((s, f) => filter(s, f), ch));
  const block = Math.round(0.4 * fs);
  const hop = Math.round(0.1 * fs);
  const z: number[] = [];
  for (let s = 0; s + block <= (w[0]?.length ?? 0); s += hop) {
    let sum = 0;
    for (const ch of w) for (let i = s; i < s + block; i++) sum += ch[i] * ch[i];
    z.push(sum / block);
  }
  const lk = (p: number) => -0.691 + 10 * Math.log10(p);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const abs = z.filter((p) => lk(p) > -70);
  if (!abs.length) return -Infinity;
  const rel = lk(mean(abs)) - 10;
  const gated = abs.filter((p) => lk(p) > rel);
  return gated.length ? lk(mean(gated)) : -Infinity;
}

/** True peak in dBTP: the largest |sample| after 4× oversampling (a 48-tap windowed-sinc interpolator). */
export function truePeakDb(channels: readonly ArrayLike<number>[]): number {
  const OS = 4;
  const HALF = 12;
  const taps = Array.from({ length: OS }, (_, p) =>
    Array.from({ length: 2 * HALF }, (_, j) => {
      const t = j - HALF + 1 - p / OS;
      const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
      const win = 0.5 + 0.5 * Math.cos((Math.PI * t) / HALF);
      return sinc * win;
    }),
  );
  let peak = 0;
  for (const x of channels) {
    for (let i = 0; i < x.length; i++) {
      peak = Math.max(peak, Math.abs(x[i]));
      for (let p = 1; p < OS; p++) {
        let s = 0;
        for (let j = 0; j < 2 * HALF; j++) {
          const k = i + j - HALF + 1;
          if (k >= 0 && k < x.length) s += x[k] * taps[p][j];
        }
        peak = Math.max(peak, Math.abs(s));
      }
    }
  }
  return 20 * Math.log10(peak || Number.MIN_VALUE);
}

/** Spectral flatness (0 = a pure tone, 1 = white noise) of `x`'s power spectrum, by a plain DFT of `n` points. */
export function spectralFlatness(x: ArrayLike<number>, n = 2048): number {
  const len = Math.min(n, x.length);
  const power: number[] = [];
  for (let k = 1; k < len / 2; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < len; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1));
      re += x[i] * w * Math.cos((2 * Math.PI * k * i) / len);
      im -= x[i] * w * Math.sin((2 * Math.PI * k * i) / len);
    }
    power.push(re * re + im * im + 1e-20);
  }
  const logMean = power.reduce((a, p) => a + Math.log(p), 0) / power.length;
  return Math.exp(logMean) / (power.reduce((a, b) => a + b, 0) / power.length);
}
