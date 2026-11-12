// Work that can wait until the page is usable and the main thread has a moment: prefetching the next page's code or the
// data the first sound needs. requestIdleCallback where the browser has it (with a deadline, so it still runs on a busy
// page), a short timeout where it doesn't.

/** The longest an idle task waits for a quiet moment. */
const IDLE_DEADLINE_MS = 4000;
const FALLBACK_MS = 1500;

/** Runs `task` once the page is idle; returns a cancel. */
export function whenIdle(task: () => void, deadlineMs = IDLE_DEADLINE_MS): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: deadlineMs });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, FALLBACK_MS);
  return () => window.clearTimeout(id);
}

