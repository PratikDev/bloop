// "Close your eyes" (TEAM_BUILD_PLAN C1): about 10 s of real ocean and rain
// sound along a path (L3's openingPath() over the Bay of Bengal), with long
// glides, fading in over 2 s and out over 1.5 s. Both tracks play whatever the
// track mode. Captions tell the listener to close, then open, their eyes.

import { emitCaption } from "../captions";
import { getCtx, getGraph } from "../context";
import { liveVoices, routeRain } from "../live";
import { MAPPING } from "../mapping";
import { glideTo } from "../params";
import type { PlayerHandle, SweepPoint } from "../types";
import { playSequence } from "./sequence";
import { evenSteps } from "./steps";

const DEFAULT_DURATION_SEC = 10;
const FADE_IN_SEC = 2;
const FADE_OUT_SEC = 1.5;
const RESTORE_SEC = 0.05;
const VOICES = ["ocean", "rain", "snow"] as const;

/** The fade shapes the voices' channel inputs (normally fixed at the voice cap); restored afterwards. */
function scheduleFades(start: number, durationSec: number) {
  const cap = MAPPING.global.voiceMaxGain;
  for (const id of VOICES) {
    const gain = getGraph().channels[id].input.gain;
    gain.cancelScheduledValues(start);
    gain.setValueAtTime(0, start);
    gain.linearRampToValueAtTime(cap, start + FADE_IN_SEC);
    gain.setValueAtTime(cap, start + durationSec - FADE_OUT_SEC);
    gain.linearRampToValueAtTime(0, start + durationSec);
  }
}

function restoreChannels() {
  const cap = MAPPING.global.voiceMaxGain;
  for (const id of VOICES) glideTo(getCtx(), getGraph().channels[id].input.gain, cap, RESTORE_SEC);
}

export function playOpening(points: SweepPoint[], opts: { durationSec?: number } = {}): PlayerHandle {
  const durationSec = opts.durationSec ?? DEFAULT_DURATION_SEC;
  const stepSec = points.length > 0 ? durationSec / points.length : durationSec;
  const starts = evenSteps(points.length, stepSec);

  const steps = points.map((p, i) => ({
    at: starts[i],
    run: (time: number) => {
      const v = liveVoices();
      if (!v) return;
      v.ocean.set(p.valueC, p.lon, { time, glideSec: stepSec }); // long glides between points
      routeRain(v, p.mmPerHour, p.phase, p.lon, { time });
    },
  }));

  return playSequence({
    id: "opening",
    steps,
    durationSec,
    holdLive: true,
    liftTrackGate: true,
    onStart: (start) => {
      scheduleFades(start, durationSec);
      emitCaption("caption.opening.closeEyes");
    },
    onEnd: () => emitCaption("caption.opening.openEyes"),
    onFinish: restoreChannels,
  });
}
