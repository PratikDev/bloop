const MEGH = [0, 2, 5, 7, 10] as const;
export const MEEND_SEC = 0.12;
export const MEEND_MIN_STEP = 0.25;

export function nearestSwara(hz: number, sa: number): number {
  const cents = 1200 * Math.log2(hz / sa);
  const octave = Math.floor(cents / 1200);
  let best = octave * 12;
  for (const s of [...MEGH, 12]) {
    const step = octave * 12 + s;
    if (Math.abs(step * 100 - cents) < Math.abs(best * 100 - cents)) best = step;
  }
  return sa * 2 ** (best / 12);
}
