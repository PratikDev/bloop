// stopAll(): the Esc key (AUDIO_RESEARCH C5). Cancels everything scheduled,
// fades every bus to silence in ~50 ms (no click), stops the sources that
// were playing, then quietly restores the buses so the next sound works.

import { emitState, peekEngine } from "./context";
import { BUS_LEVELS, type BusName } from "./graph";
import { MAPPING } from "./mapping";
import { fadeTo, glideTo } from "./params";
import { cancelAll } from "./scheduler";
import { beginStop, currentEpoch, stopSources } from "./sources";

const BUSES = Object.keys(BUS_LEVELS) as BusName[];
const RESTORE_GLIDE_SEC = 0.02;

type StopListener = () => void;
const stopListeners = new Set<StopListener>();

/** Voices and players register here to reset their own state when everything stops. */
export function onStopAll(listener: StopListener): () => void {
  stopListeners.add(listener);
  return () => {
    stopListeners.delete(listener);
  };
}

export function stopAll() {
  cancelAll();
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();

  const engine = peekEngine();
  if (!engine) return;
  const { ctx, graph } = engine;
  const fadeSec = MAPPING.global.stopFadeMs / 1000;
  const stopping = beginStop();

  for (const name of BUSES) fadeTo(ctx, graph[name].gain, 0, fadeSec);

  setTimeout(() => {
    stopSources(stopping);
    for (const listener of stopListeners) listener();
    // A newer stopAll owns the buses now; let it restore them.
    if (currentEpoch() !== stopping + 1) return;
    for (const name of BUSES) glideTo(ctx, graph[name].gain, BUS_LEVELS[name], RESTORE_GLIDE_SEC);
    emitState();
  }, fadeSec * 1000 + 10);
}
