import { Button } from "@/components/ui/button";
import { mapVoice, panFor } from "@/lib/audio/mapping";
import type { LiveStats } from "./use-live-stats";
import type { OceanInput, RainInput } from "./use-live-controls";

interface LiveReadoutProps {
  ocean: OceanInput;
  rain: RainInput;
  stats: LiveStats;
  onResetStats: () => void;
}

const fmt = (v: number | null, digits: number, unit: string) => (v === null ? "silent" : `${v.toFixed(digits)} ${unit}`);

/** What the engine should be doing, computed with the same mapping.ts rules, plus measured event counts. */
export default function LiveReadout({ ocean, rain, stats, onResetStats }: LiveReadoutProps) {
  const oceanHz = ocean.noData ? null : mapVoice("ocean", ocean.valueC);
  const dropVoice = rain.phase === "frozen" ? "snow" : "rain";
  const wet = rain.phase === "liquid" || rain.phase === "frozen";
  const dropsPerSec = wet ? mapVoice(dropVoice, rain.mmPerHour) : null;

  return (
    <div className="flex flex-col gap-2 font-mono text-sm text-muted-foreground">
      <p>
        ocean {fmt(oceanHz, 1, "Hz")} · pan {panFor(ocean.lon).toFixed(2)}
      </p>
      <p>
        {dropVoice} rule {fmt(dropsPerSec, 1, "drops/s")} · pan {panFor(rain.lon).toFixed(2)}
      </p>
      <p>
        measured {stats.dropsPerSec.toFixed(1)} drops/s (last 10 s) · total {stats.dropsTotal} · late{" "}
        {stats.lateDrops} · gain outside 0..1 {stats.badGain}
      </p>
      <p>value captions: max {stats.captionsPerSecMax} in any 1 s (must be ≤ 4)</p>
      <Button className="self-start" size="xs" variant="ghost" onClick={onResetStats}>
        reset counts
      </Button>
    </div>
  );
}
