// Ducking (AUDIO_RESEARCH A6): while anything is speaking (browser speech now,
// recorded narration in Phase 8), the sonification bus glides down to
// mapping.json's duck level and glides back when the last speaker ends. Each
// speaker holds its own release, so an interrupted utterance can never leave
// the bus ducked or restore it under a newer one.

import { emitState, peekEngine } from "./context";
import { BUS_LEVELS } from "./graph";
import { MAPPING } from "./mapping";
import { glideTo } from "./params";
import { onStopAll } from "./stop";

let holders = 0;
let enabled = true;

function apply() {
  const engine = peekEngine();
  if (!engine) return;
  const { level, attackSec, releaseSec } = MAPPING.global.duck;
  const ducked = holders > 0 && enabled;
  const target = ducked ? BUS_LEVELS.sonification * level : BUS_LEVELS.sonification;
  glideTo(engine.ctx, engine.graph.sonification.gain, target, ducked ? attackSec : releaseSec);
  emitState(false, ducked);
}

/** Ducks the sonification; call the returned function (once) to release. */
export function beginDuck(): () => void {
  holders++;
  apply();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    apply();
  };
}

export function isDucked(): boolean {
  return holders > 0 && enabled;
}

/** Ear test T2 only: compare speech with and without ducking. */
export function setDuckingEnabled(on: boolean) {
  enabled = on;
  apply();
}

// stopAll() cancels every speaker and restores the buses itself.
onStopAll(() => {
  holders = 0;
});
