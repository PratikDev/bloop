const MAX_MODES = 2;
const MIN_SHARE = 0.05;
const BINS_PER_SIGMA = 10;
const REACH = 4;
const MAX_BINS = 20_000;

export interface ValueMode {
  value: number;
  fraction: number;
  from: number;
  to: number;
}

function smoothed(values: ArrayLike<number>, sigma: number) {
  const lo = values[0] - REACH * sigma;
  const span = values[values.length - 1] + REACH * sigma - lo;
  const bins = Math.min(MAX_BINS, Math.ceil((span / sigma) * BINS_PER_SIGMA) + 1);
  const dx = span / (bins - 1);
  const hist = new Float64Array(bins);
  for (let i = 0; i < values.length; i++) hist[Math.min(bins - 1, Math.round((values[i] - lo) / dx))]++;
  const s = sigma / dx;
  const reach = Math.ceil(REACH * s);
  const kernel = Array.from({ length: 2 * reach + 1 }, (_, k) => Math.exp(-0.5 * ((k - reach) / s) ** 2));
  const d = new Float64Array(bins);
  for (let i = 0; i < bins; i++) {
    if (hist[i] === 0) continue;
    for (let k = -reach; k <= reach; k++) if (i + k >= 0 && i + k < bins) d[i + k] += hist[i] * kernel[k + reach];
  }
  return { d, lo, dx };
}

function peaks(d: Float64Array): number[] {
  const out: number[] = [];
  for (let i = 1; i < d.length - 1; i++) {
    if (!(d[i] > d[i - 1])) continue;
    let j = i;
    while (j + 1 < d.length && d[j + 1] === d[i]) j++;
    if (j + 1 < d.length && d[j + 1] < d[i]) out.push(Math.floor((i + j) / 2));
    i = j;
  }
  return out;
}

function prominence(d: Float64Array, p: number): number {
  let left = d[p];
  for (let i = p - 1; i >= 0 && d[i] <= d[p]; i--) left = Math.min(left, d[i]);
  let right = d[p];
  for (let i = p + 1; i < d.length && d[i] <= d[p]; i++) right = Math.min(right, d[i]);
  return d[p] - Math.max(left, right);
}

function lowerBound(values: ArrayLike<number>, x: number): number {
  let a = 0;
  let b = values.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if (values[m] < x) a = m + 1;
    else b = m;
  }
  return a;
}

export function findModes(values: ArrayLike<number>, sigma: number): ValueMode[] {
  const n = values.length;
  if (n === 0 || !(sigma > 0) || !Number.isFinite(sigma)) return [];
  const { d, lo, dx } = smoothed(values, sigma);
  const top = d.reduce((m, x) => Math.max(m, x), 0);
  const found = peaks(d)
    .filter((p) => prominence(d, p) >= MIN_SHARE * top)
    .sort((a, b) => d[b] - d[a])
    .slice(0, MAX_MODES)
    .sort((a, b) => a - b);
  const at = (i: number) => lo + i * dx;
  if (found.length < 2) {
    const p = found[0] ?? d.indexOf(top);
    return [{ value: at(p), fraction: 1, from: 0, to: n }];
  }
  const [a, b] = found;
  let valley = a;
  for (let i = a; i <= b; i++) if (d[i] < d[valley]) valley = i;
  const split = lowerBound(values, at(valley));
  const groups = [
    { value: at(a), fraction: split / n, from: 0, to: split },
    { value: at(b), fraction: (n - split) / n, from: split, to: n },
  ];
  const kept = groups.filter((g) => g.fraction >= MIN_SHARE);
  return kept.length === 2 ? groups : [{ ...kept[0], fraction: 1, from: 0, to: n }];
}
