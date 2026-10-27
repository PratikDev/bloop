// Needle drop and record change. The data voices go quiet; the arm lifts,
// swings out and lowers with easing (for a record change the record also rises,
// its label swaps at the top, and it settles back); the earcon sounds on
// touchdown, then the data voice fades in. Skippable; instant with reduced motion.
// TODO(turntable: Bloop drop): a data-driven drop cue whose pitch is the Bay of
// Bengal SST (read with valueAt, mapped by the ocean rule), replacing the UI earcon.

const SETTLE_MS = 150; // earcon first, then the data
const LIFT_HEIGHT = 0.3; // globe radii

/** Phases in ms: needle drop alone, or a full record change (~1 s). */
const DROP = { lift: 220, lower: 280 } as const;
const CHANGE = { park: 300, rise: 300, fall: 300, back: 300 } as const;

export interface DropFrame {
  lift: number; // needle height off the globe
  park: number; // 0 = on the groove, 1 = at rest beside the globe
  recordLift: number; // 0 = on the platter, 1 = lifted
  swap: boolean; // true on the frame the record's label should change
  landed: boolean; // true on the frame the needle touches down
  done: boolean; // the data voice may play again
}

export interface NeedleDrop {
  start(now: number, opts: { reduceMotion: boolean; recordChange: boolean }): void;
  /** Jump to touchdown (any key or click during a record change). */
  skip(now: number): void;
  running(): boolean;
  step(now: number): DropFrame | null;
}

const ease = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function createNeedleDrop(): NeedleDrop {
  let start: number | null = null;
  let touchdown = 0;
  let recordChange = false;
  let landed = false;
  let swapped = false;

  const shape = (t: number): Omit<DropFrame, "swap" | "landed" | "done"> => {
    if (t >= touchdown) return { lift: 0, park: 0, recordLift: 0 };
    if (!recordChange) {
      const lift = t < DROP.lift ? ease(t / DROP.lift) : ease(1 - (t - DROP.lift) / DROP.lower);
      return { lift: lift * LIFT_HEIGHT, park: 0, recordLift: 0 };
    }
    const { park, rise, fall, back } = CHANGE;
    const out = ease(t / park) - ease((t - park - rise - fall) / back);
    const up = ease((t - park * 0.6) / rise) - ease((t - park * 0.6 - rise) / fall);
    return { lift: LIFT_HEIGHT * Math.max(0, out), park: Math.max(0, out), recordLift: Math.max(0, up) };
  };

  return {
    start(now, opts) {
      start = now;
      recordChange = opts.recordChange;
      touchdown = opts.reduceMotion ? 0 : recordChange ? CHANGE.park + CHANGE.rise + CHANGE.fall + CHANGE.back : DROP.lift + DROP.lower;
      landed = false;
      swapped = false;
    },
    skip(now) {
      if (start !== null && now - start < touchdown) start = now - touchdown;
    },
    running: () => start !== null,
    step(now) {
      if (start === null) return null;
      const t = now - start;
      const f = shape(t);
      const swap = !swapped && (!recordChange || t >= CHANGE.park * 0.6 + CHANGE.rise || t >= touchdown);
      if (swap) swapped = true;
      const landsNow = !landed && t >= touchdown;
      if (landsNow) landed = true;
      const done = t >= touchdown + SETTLE_MS;
      if (done) start = null;
      return { ...f, swap, landed: landsNow, done };
    },
  };
}
