import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getLookahead, playTicks } from "@/lib/audio/dev";
import HarnessSection from "./HarnessSection";

const TICK_COUNT = 20;
const TICK_INTERVAL_MS = 100;
const BUSY_OPTIONS_MS = [60, 300];

/** Blocks the main thread, like a heavy render would. */
function busyWait(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // spin
  }
}

interface TickStats {
  done: number;
  minHeadroomMs: number;
  late: number;
}

const EMPTY: TickStats = { done: 0, minHeadroomMs: Infinity, late: 0 };

interface SchedulerSectionProps {
  ready: boolean;
}

export default function SchedulerSection({ ready }: SchedulerSectionProps) {
  const [stats, setStats] = useState<TickStats>(EMPTY);

  const run = () => {
    setStats(EMPTY);
    playTicks(TICK_COUNT, TICK_INTERVAL_MS, (_, headroomMs) =>
      setStats((s) => ({
        done: s.done + 1,
        minHeadroomMs: Math.min(s.minHeadroomMs, headroomMs),
        late: s.late + (headroomMs < 0 ? 1 : 0),
      })),
    );
  };

  const lookaheadMs = Math.round(getLookahead() * 1000);

  return (
    <HarnessSection
      title="Scheduler"
      phase={1}
      description={`${TICK_COUNT} ticks exactly ${TICK_INTERVAL_MS} ms apart on the audio clock. Look-ahead is ${lookaheadMs} ms: a main-thread block shorter than that must not disturb the rhythm; a longer one makes ticks late (expected, and why the look-ahead exists).`}
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!ready} onClick={run}>
          Play {TICK_COUNT} ticks
        </Button>
        {BUSY_OPTIONS_MS.map((ms) => (
          <Button key={ms} variant="secondary" disabled={!ready} onClick={() => busyWait(ms)}>
            Busy main thread {ms} ms
          </Button>
        ))}
      </div>
      <p className="font-mono text-sm text-muted-foreground">
        ticks {stats.done}/{TICK_COUNT} · min headroom{" "}
        {Number.isFinite(stats.minHeadroomMs) ? `${stats.minHeadroomMs.toFixed(1)} ms` : "—"} ·{" "}
        <span className={stats.late > 0 ? "text-destructive" : undefined}>late {stats.late}</span>
      </p>
    </HarnessSection>
  );
}
