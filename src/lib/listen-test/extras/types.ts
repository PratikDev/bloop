export type ExtraRecord = Record<string, string | number | boolean | null>;

export interface ExtraTaskInfo {
  id: string;
  seconds: number;
}

const TASK_SECONDS = 45;
const FIXED_SECONDS = 30 + 45 + 60;

export const planSeconds = (tasks: number, extras: readonly ExtraTaskInfo[]) => FIXED_SECONDS + tasks * TASK_SECONDS + extras.reduce((sum, e) => sum + e.seconds, 0);

export function counterbalance<T>(a: T, b: T, coin: number): [T, T] {
  return coin < 0.5 ? [a, b] : [b, a];
}
