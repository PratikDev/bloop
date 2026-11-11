// PURE: the value groups (modes) of a box, for the value chord. The box's values are binned
// finely, smoothed with a Gaussian whose σ is the record's measured error (so two groups closer than the error merge),
// and at most MAX_MODES peaks are kept: each with prominence ≥ MIN_SHARE of the highest peak (the rule the gate's
// Check 6 ran) and holding ≥ MIN_SHARE of the box's cells. Two groups split at the lowest point
// of the smoothed curve between them.

export const MAX_MODES = 2;
/** 5 %: a peak's minimum prominence (of the highest peak) and minimum share of the box's cells. */
export const MIN_SHARE = 0.05;
/** Bins per σ, the Gaussian's reach in σ, and a cap on the bins (a very wide box gets coarser bins). */
const BINS_PER_SIGMA = 10;
const REACH = 4;
const MAX_BINS = 20_000;

export interface ValueMode {
  /** The group's value: the smoothed curve's peak (resolution σ / BINS_PER_SIGMA). */
  value: number;
  /** Share of the box's valid cells in the group, 0..1. */
  fraction: number;
  /** The group's cells: indices [from, to) into the ascending values (BoxStats.values / .cells). */
  from: number;
  to: number;
}

/** The Gaussian-smoothed histogram of ascending `values` over [lo, lo + bins·dx). */
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

/** Local maxima (a plateau counts once, at its middle). */
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

/** A peak's prominence (scipy's definition): its height over the higher of the lowest points on each side before a higher sample. */
function prominence(d: Float64Array, p: number): number {
  let left = d[p];
  for (let i = p - 1; i >= 0 && d[i] <= d[p]; i--) left = Math.min(left, d[i]);
  let right = d[p];
  for (let i = p + 1; i < d.length && d[i] <= d[p]; i++) right = Math.min(right, d[i]);
  return d[p] - Math.max(left, right);
}

/** First index of an ascending array at or above x. */
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

/** The box's value groups, low to high: none for an empty box or an unknown error; one or two otherwise. */
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
  // A group with too few cells is not a group of its own: its cells join the other.
  const kept = groups.filter((g) => g.fraction >= MIN_SHARE);
  return kept.length === 2 ? groups : [{ ...kept[0], fraction: 1, from: 0, to: n }];
}
