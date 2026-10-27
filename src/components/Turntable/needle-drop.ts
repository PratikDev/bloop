// Needle drop when a record is chosen: the data voices go quiet, the arm lifts
// and lowers, the earcon sounds on touchdown, then the data voice starts.
// With reduced motion the needle doesn't move: earcon at once, then the voice.
// TODO(turntable: Bloop drop): a data-driven drop cue whose pitch is the Bay of
// Bengal SST (read with valueAt, mapped by the ocean rule), replacing the UI earcon.

const LIFT_MS = 220;
const LOWER_MS = 280;
const SETTLE_MS = 150; // earcon first, then the data
const LIFT_HEIGHT = 0.35; // globe radii

export interface DropFrame {
  lift: number; // how far the needle is off the globe
  landed: boolean; // true on the frame the needle touches down
  done: boolean; // the data voice may play again
}

export interface NeedleDrop {
  start(now: number, reduceMotion: boolean): void;
  /** Where the drop is at `now`; null when no drop is running. */
  step(now: number): DropFrame | null;
}

const ease = (x: number) => x * x * (3 - 2 * x);

export function createNeedleDrop(): NeedleDrop {
  let start: number | null = null;
  let touchdown = 0;
  let landed = false;
  return {
    start(now, reduceMotion) {
      start = now;
      touchdown = reduceMotion ? 0 : LIFT_MS + LOWER_MS;
      landed = false;
    },
    step(now) {
      if (start === null) return null;
      const t = now - start;
      const lift =
        t >= touchdown ? 0 : t < LIFT_MS ? ease(t / LIFT_MS) * LIFT_HEIGHT : ease(1 - (t - LIFT_MS) / LOWER_MS) * LIFT_HEIGHT;
      const landsNow = !landed && t >= touchdown;
      if (landsNow) landed = true;
      const done = t >= touchdown + SETTLE_MS;
      if (done) start = null;
      return { lift, landed: landsNow, done };
    },
  };
}
