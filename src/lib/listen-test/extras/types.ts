// The listener test's extra task modules (after the five core tasks, before the comment). Each module is one file
// registered with one line in src/components/pages/ListenTest/extras/registry.ts (ART: emotion, ear-vs-eye; CV adds its chord tasks the same way). A module's
// answers go into the results file under extras[its id]. PURE.

/** One answer an extra task stores (its own fields; plain JSON). */
export type ExtraRecord = Record<string, string | number | boolean | null>;

export interface ExtraTaskInfo {
  id: string;
  /** Estimated seconds for a listener, for the whole test's ≤ 10 min budget. */
  seconds: number;
}

/** The core test's estimated seconds: consent and age, the intro, five tasks, the comment. */
export const CORE_SECONDS = 30 + 45 + 5 * 45 + 60;
/** The whole test's limit (the protocol: 10 minutes). */
export const LIMIT_SECONDS = 600;

/** The whole test's estimated length (s): the core plus every registered extra. */
export const planSeconds = (extras: readonly ExtraTaskInfo[]) => CORE_SECONDS + extras.reduce((sum, e) => sum + e.seconds, 0);

/** Two conditions in a counterbalanced order: half the sessions get [a, b], half [b, a]. */
export function counterbalance<T>(a: T, b: T, coin: number): [T, T] {
  return coin < 0.5 ? [a, b] : [b, a];
}
