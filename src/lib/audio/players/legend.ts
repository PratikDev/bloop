// The audio legend (TEAM_BUILD_PLAN A4, AUDIO_RESEARCH C3): each reference
// point of a voice from mapping.json, played through the real voice (live
// voices, or the Then vs Now heat voice) with its label as a caption. Numbers
// and labels come from mapping.json only. Water has no fixed legend: its pitch
// range comes from the series being played.

import { emitCaption } from "../captions";
import { liveVoices, type LiveVoices } from "../live";
import { voiceSpec } from "../mapping";
import type { LegendVoice, PlayerHandle, TrackMode } from "../types";
import type { VoiceSpec } from "@/types/data-contract";
import { contextVoices, silenceContext } from "./context-voices";
import { idleHandle, playSequence, type SequenceStep } from "./sequence";

const POINT_SEC = 1.2; // each reference sound
const GAP_SEC = 0.4; // silence between them
export const LEGEND_POINT_SEC = POINT_SEC + GAP_SEC;

type LiveLegendVoice = keyof LiveVoices;
type PlayableLegendVoice = LiveLegendVoice | "heat";
type LegendPoint = VoiceSpec["legend"][number];

const PLAYABLE: readonly LegendVoice[] = ["ocean", "rain", "snow", "heat"];

function isPlayable(voice: LegendVoice): voice is PlayableLegendVoice {
  return PLAYABLE.includes(voice);
}

/** Sets one voice to a value (or silence) at the centre, at an exact time. */
function sound(voice: PlayableLegendVoice, value: number | null, time: number) {
  if (voice === "heat") contextVoices("center").heat.set(value, { time });
  else liveVoices()?.[voice].set(value, 0, { time });
}

/**
 * Steps for some of a voice's legend points, starting at `from` seconds:
 * caption + sound for POINT_SEC, then GAP_SEC of silence. Returns the end time.
 */
export function legendSteps(
  voice: PlayableLegendVoice,
  from: number,
  pick: (points: readonly LegendPoint[]) => readonly LegendPoint[] = (p) => p,
): { steps: SequenceStep[]; end: number } {
  const points = pick(voiceSpec(voice).legend);
  const steps = points.flatMap((point, i): SequenceStep[] => {
    const at = from + i * LEGEND_POINT_SEC;
    return [
      {
        at,
        run: (time) => {
          emitCaption("caption.legend", { voice, label: point.label });
          sound(voice, point.value, time);
        },
      },
      { at: at + POINT_SEC, run: (time) => sound(voice, null, time) },
    ];
  });
  return { steps, end: from + points.length * LEGEND_POINT_SEC };
}

/** The "L" key: every reference point of one voice. Water has none (its range comes from its series). */
export function playLegend(voice: LegendVoice): PlayerHandle {
  if (!isPlayable(voice) || voiceSpec(voice).legend.length === 0) {
    emitCaption("caption.legendUnavailable", { voice });
    return idleHandle();
  }
  const { steps, end } = legendSteps(voice, 0);
  return playSequence({
    id: `legend.${voice}`,
    steps,
    durationSec: end,
    holdLive: true,
    liftTrackGate: true,
    onFinish: silenceContext, // a heat legend stopped part-way must not keep sounding
  });
}

const MODE_VOICES: Record<TrackMode, readonly LiveLegendVoice[]> = {
  ocean: ["ocean"],
  rain: ["rain"],
  both: ["ocean", "rain"],
};

const firstAndLast = <T>(points: readonly T[]): readonly T[] =>
  points.length <= 2 ? points : [points[0], points[points.length - 1]];

/** Short reminder when the track or app mode changes: lowest and highest point of each voice (≈ 3 s each). */
export function playLegendForMode(mode: TrackMode): PlayerHandle {
  const steps: SequenceStep[] = [];
  let end = 0;
  for (const voice of MODE_VOICES[mode]) {
    const part = legendSteps(voice, end, firstAndLast);
    steps.push(...part.steps);
    end = part.end;
  }
  return playSequence({ id: "legend.mode", steps, durationSec: end, holdLive: true, liftTrackGate: true });
}
