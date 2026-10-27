// What happens at the needle at the control rate (30 Hz): the voices get the
// reading (needle-sound.ts, unchanged path), the ripple takes the frame's pixel
// colour, the particles fall at the voice's own drops per second, and the
// extreme ping fires when the needle reaches the groove's extreme cell.
// Nothing here knows the rotation speed.

import { audio } from "@/lib/audio-adapter";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { mapVoice } from "@/lib/audio/mapping";
import type { LatLon, LiveFields } from "@/lib/data";
import { readAt, type Reading } from "@/lib/reading";
import { grooveExtreme, needleCell, type Extreme } from "./extreme";
import { CONTROL_HZ, createNeedleSound, type SentReading } from "./needle-sound";
import type { Effects, ParticleKind } from "./scene/effects";
import type { GlobeTexture } from "./use-globe-texture";

const CONTROL_MS = 1000 / CONTROL_HZ;

/** The voice's own rate for a reading: drops/s (rain) or bells/s (snow), from mapping.json; 0 = none. */
export function particleRate(r: Reading, track: TrackMode): { perSecond: number; kind: ParticleKind } {
  if (track === "ocean" || r.rain.mmPerHour === null) return { perSecond: 0, kind: "rain" };
  if (r.rain.phase === "liquid") return { perSecond: mapVoice("rain", r.rain.mmPerHour) ?? 0, kind: "rain" };
  if (r.rain.phase === "frozen") return { perSecond: mapVoice("snow", r.rain.mmPerHour) ?? 0, kind: "snow" };
  return { perSecond: 0, kind: "rain" };
}

export interface ControlInput {
  fields: LiveFields;
  track: TrackMode;
  needle: LatLon;
  /** Longitude of the globe point facing the camera (centre of "in view"). */
  viewLon: number;
  /** Live sound may play now (and isn't held for a needle drop). */
  soundOn: boolean;
  allMuted: boolean;
  sample: GlobeTexture["sample"];
}

export interface Control {
  tick(now: number, input: ControlInput, effects: Effects): void;
  /** Forget the last update, so the next tick re-sends even an unchanged reading. */
  reset(): void;
}

export function createControl(onSend?: (sent: SentReading) => void): Control {
  const sound = createNeedleSound(onSend);
  let lastTick = Number.NEGATIVE_INFINITY;
  let extreme: Extreme | null = null;
  let extremeKey = "";
  let pingedCell: number | null = null;

  return {
    tick(now, input, effects) {
      if (now - lastTick < CONTROL_MS) return;
      lastTick = now;
      const { fields, track, needle } = input;
      if (input.soundOn) sound.tick(fields, needle, now);
      else sound.reset();

      const reading = readAt(fields, needle);
      effects.setRippleColor(input.sample(track, reading, needle));
      const { perSecond, kind } = particleRate(reading, track);
      effects.setParticles(perSecond, kind);

      // The extreme only changes when the groove or the view moves by a degree.
      const key = `${track}|${needle.lat.toFixed(2)}|${Math.round(input.viewLon)}|${fields.rain ? 1 : 0}`;
      if (key !== extremeKey) {
        extremeKey = key;
        extreme = grooveExtreme(fields, track, needle.lat, input.viewLon);
      }
      const cell = needleCell(fields, track, needle.lat, needle.lon);
      if (extreme && cell === extreme.cell && pingedCell !== cell) {
        pingedCell = cell;
        effects.sparkle();
        if (input.soundOn && !input.allMuted) audio.playEarcon("ping", { lon: needle.lon });
      } else if (cell !== extreme?.cell) {
        pingedCell = null;
      }
    },
    reset() {
      sound.reset();
      lastTick = Number.NEGATIVE_INFINITY;
    },
  };
}
