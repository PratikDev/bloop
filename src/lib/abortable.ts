// Small helpers for scripted sequences (Story Mode) that must stop at once
// when the user presses Esc or leaves.

/** Resolves after `ms`; rejects early with an AbortError if `signal` aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return abortable(new Promise((resolve) => setTimeout(resolve, ms)), signal);
}

/** `promise`, unless `signal` aborts first (then an AbortError). */
export function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

export const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
