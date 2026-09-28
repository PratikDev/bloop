import { useEffect, useRef, useState } from "react";
import { getAnalyser, onAudioEvent } from "@/lib/audio";

export interface Playhead {
  index: number;
  total: number;
  events: number; // step events received this run
  maxLagMs: number; // largest gap between a step's audio time and when it was shown
  spanSec: number; // audio time from this run's first step to its latest step
}

const EMPTY: Playhead = { index: -1, total: 0, events: 0, maxLagMs: 0, spanSec: 0 };

/**
 * Shows step events for one player when the audio clock reaches their time
 * (they arrive up to the look-ahead early), the way L3's chart playheads do.
 */
export function useStepPlayhead(player: string) {
  const [head, setHead] = useState(EMPTY);
  const queue = useRef<{ index: number; total: number; time: number }[]>([]);
  const stats = useRef({ events: 0, maxLagMs: 0, firstTime: 0 });

  useEffect(() => {
    const unsubscribe = onAudioEvent((e) => {
      if (e.kind !== "step" || e.player !== player) return;
      if (e.index === 0) stats.current = { events: 0, maxLagMs: 0, firstTime: e.time };
      stats.current.events++;
      queue.current.push({ index: e.index, total: e.total, time: e.time });
    });
    let frame = 0;
    const loop = () => {
      const now = getAnalyser()?.context.currentTime;
      if (now !== undefined) {
        let shown: { index: number; total: number; time: number } | null = null;
        while (queue.current.length > 0 && queue.current[0].time <= now) shown = queue.current.shift() ?? null;
        if (shown) {
          const s = stats.current;
          s.maxLagMs = Math.max(s.maxLagMs, (now - shown.time) * 1000);
          setHead({ index: shown.index, total: shown.total, events: s.events, maxLagMs: s.maxLagMs, spanSec: shown.time - s.firstTime });
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [player]);

  return head;
}
