// Caption events (keys and params agreed with L3; BUILD_PLAN §2.4). A
// throttled emitter keeps fast cursor movement from flooding the caption bar
// and screen reader, while still delivering the final value when movement stops.

import { emit } from "./events";
import type { CaptionParams } from "./types";

export function emitCaption(key: string, params: CaptionParams = {}) {
  emit({ kind: "caption", key, params });
}

/**
 * At most one caption per `intervalMs`: the first goes out at once, and the
 * latest one during the wait goes out when the wait ends (so the caption
 * always settles on the current value). This timing is for text only; no
 * sound depends on it.
 */
export function createThrottledCaption(intervalMs: number) {
  let lastAt = -Infinity;
  let pending: { key: string; params: CaptionParams } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    if (!pending) return;
    lastAt = performance.now();
    emitCaption(pending.key, pending.params);
    pending = null;
  };

  return {
    emit(key: string, params: CaptionParams) {
      pending = { key, params };
      const wait = lastAt + intervalMs - performance.now();
      if (wait <= 0) flush();
      else timer ??= setTimeout(flush, wait);
    },
    /** Drop anything waiting (e.g. the track went silent). */
    cancel() {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
