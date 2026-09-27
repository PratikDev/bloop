// The audio legend (TEAM_BUILD_PLAN A4, AUDIO_RESEARCH C3): each reference
// point of a voice from mapping.json, played through the real live voice with
// its label as a caption. Numbers and labels come from mapping.json only.

import { emitCaption } from "../captions";
import { liveVoices, type LiveVoices } from "../live";
import { voiceSpec } from "../mapping";
import type { LegendVoice, PlayerHandle, TrackMode } from "../types";
import type { VoiceSpec } from "@/types/data-contract";
import { idleHandle, playSequence, type SequenceStep } from "./sequence";

const POINT_SEC = 1.2; // each reference sound
const GAP_SEC = 0.4; // silence between them
export const LEGEND_POINT_SEC = POINT_SEC + GAP_SEC;

type LiveLegendVoice = keyof LiveVoices;
type LegendPoint = VoiceSpec["legend"][number];

const LIVE_LEGEND_VOICES: readonly LegendVoice[] = ["ocean", "rain", "snow"];

function isLiveLegendVoice(voice: LegendVoice): voice is LiveLegendVoice {
  return LIVE_LEGEND_VOICES.includes(voice);
}

/** Sets one live voice to a value (or silence) at the centre. */
function sound(voice: LiveLegendVoice, value: number | null) {
  liveVoices()?.[voice].set(value, 0);
}

/**
 * Steps for some of a voice's legend points, starting at `from` seconds:
 * caption + sound for POINT_SEC, then GAP_SEC of silence. Returns the end time.
 */
export function legendSteps(
  voice: LiveLegendVoice,
  from: number,
  pick: (points: readonly LegendPoint[]) => readonly LegendPoint[] = (p) => p,
): { steps: SequenceStep[]; end: number } {
  const points = pick(voiceSpec(voice).legend);
  const steps = points.flatMap((point, i): SequenceStep[] => {
    const at = from + i * LEGEND_POINT_SEC;
    return [
      {
        at,
        run: () => {
          emitCaption("caption.legend", { voice, label: point.label });
          sound(voice, point.value);
        },
      },
      { at: at + POINT_SEC, run: () => sound(voice, null) },
    ];
  });
  return { steps, end: from + points.length * LEGEND_POINT_SEC };
}

/** The "L" key: every reference point of one voice. Heat and water arrive with Then vs Now. */
export function playLegend(voice: LegendVoice): PlayerHandle {
  if (!isLiveLegendVoice(voice) || voiceSpec(voice).legend.length === 0) {
    emitCaption("caption.legendUnavailable", { voice });
    return idleHandle();
  }
  const { steps, end } = legendSteps(voice, 0);
  return playSequence({ id: `legend.${voice}`, steps, durationSec: end, holdLive: true, liftTrackGate: true });
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
