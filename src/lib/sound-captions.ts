import type { CaptionParams } from "@/lib/audio-adapter/types";
import type { MessageKey } from "@/lib/i18n";

interface CaptionLike {
  key: string;
  params: CaptionParams;
}

const TREND_EPS = 0.05;

type SonarTrend = "nearer" | "farther" | "same";

const SONAR_CHIP = { nearer: "sound.pingNearer", farther: "sound.pingFarther", same: "sound.pingSame" } as const satisfies Record<SonarTrend, MessageKey>;

const FIXED: Partial<Record<string, MessageKey>> = {
  "caption.unison": "sound.beatsDisagree",
  "caption.compare.pair": "sound.beatsDiffer",
};

const num = (p: CaptionParams, k: string) => (typeof p[k] === "number" ? (p[k] as number) : null);

export function sonarTrend(prev: number | null, next: number): SonarTrend {
  if (prev === null || Math.abs(next - prev) < 1e-3) return "same";
  return next > prev ? "nearer" : "farther";
}

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
