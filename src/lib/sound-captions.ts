// PURE: sound captions: a short visual note on what the last sound did, for
// Deaf and hard-of-hearing visitors too ("rain thickening ↑", "beats = the two sources disagree"). Worked out from the
// caption events every sound already sends, so a sound without one is a missing caption, never a missing note.
import type { CaptionParams } from "@/lib/audio-adapter/types";
import type { MessageKey } from "@/lib/i18n";

export interface CaptionLike {
  key: string;
  params: CaptionParams;
}

/** The smallest change that counts as rising or falling (the readouts' precision: 0.1 °C, 0.1 mm/h). */
export const TREND_EPS = 0.05;

export type SonarTrend = "nearer" | "farther" | "same";

const SONAR_CHIP = { nearer: "sound.pingNearer", farther: "sound.pingFarther", same: "sound.pingSame" } as const satisfies Record<SonarTrend, MessageKey>;

/** Captions whose sound always means the same thing. */
const FIXED: Partial<Record<string, MessageKey>> = {
  "caption.unison": "sound.beatsDisagree",
  "caption.compare.pair": "sound.beatsDiffer",
};

const num = (p: CaptionParams, k: string) => (typeof p[k] === "number" ? (p[k] as number) : null);

/** Which way a closeness (0 far … 1 at the target) moved since the last ping. */
export function sonarTrend(prev: number | null, next: number): SonarTrend {
  if (prev === null || Math.abs(next - prev) < 1e-3) return "same";
  return next > prev ? "nearer" : "farther";
}

/**
 * The note for a caption, given the last value caption on each track (updated in place), or null when the sound needs
 * none (its caption already says it all).
 */
export function soundChip(e: CaptionLike, lastValue: Map<string, number>): MessageKey | null {
  const fixed = FIXED[e.key];
  if (fixed) return fixed;
  if (e.key === "caption.sonar.ping") {
    const trend = e.params.trend;
    return trend === "nearer" || trend === "farther" || trend === "same" ? SONAR_CHIP[trend] : null;
  }
  if (e.key !== "caption.value") return null;
  const track = String(e.params.track ?? "");
  const value = num(e.params, "value");
  if (value === null) return null;
  const prev = lastValue.get(track);
  lastValue.set(track, value);
  if (prev === undefined || Math.abs(value - prev) < TREND_EPS) return null;
  if (track === "ocean") return value > prev ? "sound.toneUp" : "sound.toneDown";
  return value > prev ? "sound.dropsUp" : "sound.dropsDown";
}
