// Live exploration (Phase 2): the cursor's values drive the ocean, rain and
// snow voices. Handles honest silence, the no-data tick on entering a
// no-data area, and throttled value captions. Calls before Start do nothing.

import { createThrottledCaption, emitCaption } from "./captions";
import { getCtx, peekEngine } from "./context";
import { isVoiceAudible } from "./mixer";
import { onStopAll } from "./stop";
import type { RainPhase } from "./types";
import { createOceanVoice, type OceanVoice } from "./voices/ocean";
import { createRainVoice } from "./voices/rain";
import { createSnowVoice } from "./voices/snow";
import type { DropVoice } from "./voices/drops";
import { playNoDataTick } from "./earcons";

const CAPTION_INTERVAL_MS = 250; // ≤ 4 value captions per second per track
const TICK_MIN_GAP_MS = 300; // at most one no-data tick per 300 ms

type Track = "ocean" | "rain";

interface Voices {
  ocean: OceanVoice;
  rain: DropVoice;
  snow: DropVoice;
}

let voices: Voices | null = null;

/** Built on first use, after Start (they need the AudioContext). */
function getVoices(): Voices | null {
  if (!peekEngine()) return null;
  voices ??= { ocean: createOceanVoice(), rain: createRainVoice(), snow: createSnowVoice() };
  return voices;
}

const captions: Record<Track, ReturnType<typeof createThrottledCaption>> = {
  ocean: createThrottledCaption(CAPTION_INTERVAL_MS),
  rain: createThrottledCaption(CAPTION_INTERVAL_MS),
};

// null = unknown (nothing played yet, or silenced): entering no-data from here still ticks.
const inNoData: Record<Track, boolean | null> = { ocean: null, rain: null };
let lastTickAt = -Infinity;

function forgetPosition() {
  inNoData.ocean = null;
  inNoData.rain = null;
  captions.ocean.cancel();
  captions.rain.cancel();
}

onStopAll(forgetPosition);

/** Tick + caption on the transition into no data, only if that track can be heard. */
function updateNoData(trackName: Track, noData: boolean, lon: number, audible: boolean) {
  const entering = noData && inNoData[trackName] !== true;
  inNoData[trackName] = noData;
  if (!entering || !audible) return;
  captions[trackName].cancel();
  emitCaption("caption.nodata", { track: trackName });
  const now = performance.now();
  if (now - lastTickAt < TICK_MIN_GAP_MS) return;
  lastTickAt = now;
  playNoDataTick(getCtx().currentTime, lon);
}

/** Cursor moved: ocean temperature in °C (null = land / no data) at a longitude. */
export function setOcean(valueC: number | null, lon: number) {
  const v = getVoices();
  if (!v) return;
  v.ocean.set(valueC, lon);
  const audible = isVoiceAudible("ocean");
  updateNoData("ocean", valueC === null, lon, audible);
  if (valueC !== null && audible) captions.ocean.emit("caption.value", { track: "ocean", value: valueC });
}

/** Cursor moved: rain rate (0 = dry, null = no data) and phase at a longitude. */
export function setRain(mmPerHour: number | null, phase: RainPhase, lon: number) {
  const v = getVoices();
  if (!v) return;
  v.rain.set(phase === "liquid" ? mmPerHour : null, lon);
  v.snow.set(phase === "frozen" ? mmPerHour : null, lon);
  const audible = isVoiceAudible(phase === "frozen" ? "snow" : "rain");
  updateNoData("rain", phase === "nodata", lon, audible);
  if (phase !== "nodata" && audible) {
    captions.rain.emit("caption.value", { track: "rain", value: mmPerHour ?? 0, phase });
  }
}

/** The cursor left the map, or exploration paused: fade the live voices out (no tick). */
export function silenceLive() {
  const v = getVoices();
  if (!v) return;
  v.ocean.set(null, 0);
  v.rain.set(null, 0);
  v.snow.set(null, 0);
  forgetPosition();
}
