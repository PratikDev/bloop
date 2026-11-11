// PURE: the dial's gridline ticks at 0 Measure: fixed reference notes at round values on a record's axis, like a
// chart's gridlines. A tick sounds when the value crosses one; it plays the round value's own pitch (the same rule),
// quietly, and never moves the data voice.

interface AxisInput {
  min: number;
  max: number;
  scale: "linear" | "log";
}

/** A 1-2-5 step giving about `target` lines over the range. */
export function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

/** The round values on an axis: multiples of a nice step (linear), or 1, 2, 5 × 10^k (log). */
export function gridlines(input: AxisInput): number[] {
  if (input.scale === "log") {
    const out: number[] = [];
    for (let k = Math.floor(Math.log10(input.min)); k <= Math.ceil(Math.log10(input.max)); k++) {
      for (const m of [1, 2, 5]) {
        const v = Number((m * 10 ** k).toPrecision(6));
        if (v >= input.min && v <= input.max) out.push(v);
      }
    }
    return out;
  }
  const step = niceStep(input.max - input.min);
  const out: number[] = [];
  for (let v = Math.ceil(input.min / step) * step; v <= input.max + step * 1e-9; v += step) out.push(Number(v.toPrecision(10)));
  return out;
}

/** The gridlines passed going from `prev` to `next` (in the order travelled); a line landed on counts as crossed. */
export function crossed(lines: readonly number[], prev: number, next: number): number[] {
  if (prev === next) return [];
  const up = next > prev;
  const hit = lines.filter((g) => (up ? g > prev && g <= next : g < prev && g >= next));
  return up ? hit : hit.reverse();
}
