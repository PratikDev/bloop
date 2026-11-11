// PURE: swara + meend (the dial at 1 Music). The data voice first sounds the nearest note of a fixed Megh-style scale
// on the record's Sa, then glides exponentially to the exact data pitch, landing on it: the settled pitch is the true
// value. Ported from pipeline/reference/bloop_data_tests.py I3 (Kafi-thaat komal ni; Megh omits Ga and Dha).

/** Semitones above Sa: S R M P n (and the upper S). */
const MEGH = [0, 2, 5, 7, 10] as const;
/** How long the glide from the swara to the data pitch takes (s); the note is settled from then on. */
export const MEEND_SEC = 0.12;
/** A meend only where notes last long enough to settle after it (s between moves): a fast sweep glides as usual. */
export const MEEND_MIN_STEP = 0.25;

/** The nearest Megh note to `hz` on `sa` (Hz). */
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
