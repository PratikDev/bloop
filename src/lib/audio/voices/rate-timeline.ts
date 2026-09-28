// PURE: a time-ordered list of changes, so a voice scheduled ahead of the
// clock can ask "what was in force at this moment?" (e.g. which rain rate
// applies to a drop falling at t = 12.34 s).

export interface Timeline<T> {
  /** Records a change taking effect at `time`; later changes at or after it are replaced. */
  set(time: number, value: T): void;
  /** The value in force at `time` (the last change at or before it), or `initial` if none. */
  at(time: number): T;
  /** Every change after `time`, in time order. */
  changesAfter(time: number): { time: number; value: T }[];
  /** The first change after `time` whose value passes `accept`, or null. */
  nextAfter(time: number, accept: (value: T) => boolean): { time: number; value: T } | null;
  /** Forgets changes that can no longer matter before `time` (keeps the one in force). */
  prune(time: number): void;
  /** Back to `initial`, no changes. */
  clear(): void;
}

export function createTimeline<T>(initial: T): Timeline<T> {
  let changes: { time: number; value: T }[] = [];

  const lastAtOrBefore = (time: number) => {
    let found = -1;
    for (let i = 0; i < changes.length && changes[i].time <= time; i++) found = i;
    return found;
  };

  return {
    set(time, value) {
      changes = changes.filter((c) => c.time < time);
      changes.push({ time, value });
    },
    at(time) {
      const i = lastAtOrBefore(time);
      return i === -1 ? initial : changes[i].value;
    },
    changesAfter(time) {
      return changes.filter((c) => c.time > time);
    },
    nextAfter(time, accept) {
      return changes.find((c) => c.time > time && accept(c.value)) ?? null;
    },
    prune(time) {
      const i = lastAtOrBefore(time);
      if (i > 0) changes = changes.slice(i);
    },
    clear() {
      changes = [];
    },
  };
}
