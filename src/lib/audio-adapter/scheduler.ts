// One shared look-ahead scheduler (docs/L2/AUDIO_RESEARCH.md A2): a timer wakes
// every 25 ms and each task schedules everything due in the next 100 ms against
// the audio clock. Sound timing never comes from React state or animation frames.

const TICK_MS = 25;
const LOOKAHEAD_SEC = 0.1; // raise to 0.2 if drops stutter on Android

/** A task schedules its audio up to `until` (AudioContext time). */
export type Task = (until: number) => void;

const tasks = new Set<Task>();
let timer: ReturnType<typeof setInterval> | null = null;
let clock: BaseAudioContext | null = null;

function tick() {
  if (!clock) return;
  const until = clock.currentTime + LOOKAHEAD_SEC;
  for (const task of tasks) task(until);
}

export function startScheduler(ctx: BaseAudioContext): void {
  clock = ctx;
  timer ??= setInterval(tick, TICK_MS);
}

export function addTask(task: Task): () => void {
  tasks.add(task);
  return () => {
    tasks.delete(task);
  };
}

/** How far ahead tasks schedule; stopAll waits this long before un-muting. */
export const SCHEDULE_AHEAD_SEC = LOOKAHEAD_SEC;
