import { useEffect, useRef, useState } from "react";
import { getAnalyser, onAudioEvent } from "@/lib/audio";

const RATE_WINDOW_MS = 10_000;
const CAPTION_WINDOW_MS = 1_000;
const REFRESH_MS = 250;

export interface LiveStats {
  dropsTotal: number;
  dropsPerSec: number; // measured over the last 10 s
  lateDrops: number; // drop events whose time had already passed when they arrived
  badGain: number; // drop events with gain outside 0..1
  captionsPerSecMax: number; // most caption.value events seen in any 1 s
}

const EMPTY: LiveStats = { dropsTotal: 0, dropsPerSec: 0, lateDrops: 0, badGain: 0, captionsPerSecMax: 0 };

/** Counts drop and caption events so the Phase 2 checks can be read off the page. */
export function useLiveStats() {
  const [stats, setStats] = useState(EMPTY);
  const acc = useRef({ ...EMPTY, dropTimes: [] as number[], captionTimes: [] as number[] });

  useEffect(() => {
    const unsubscribe = onAudioEvent((e) => {
      const a = acc.current;
      const now = performance.now();
      if (e.kind === "drop") {
        a.dropsTotal++;
        a.dropTimes.push(now);
        const audioNow = getAnalyser()?.context.currentTime ?? 0;
        if (e.time < audioNow) a.lateDrops++;
        if (e.gain < 0 || e.gain > 1) a.badGain++;
      } else if (e.kind === "caption" && e.key === "caption.value") {
        a.captionTimes.push(now);
        a.captionTimes = a.captionTimes.filter((t) => now - t <= CAPTION_WINDOW_MS);
        a.captionsPerSecMax = Math.max(a.captionsPerSecMax, a.captionTimes.length);
      }
    });
    const refresh = setInterval(() => {
      const a = acc.current;
      const now = performance.now();
      a.dropTimes = a.dropTimes.filter((t) => now - t <= RATE_WINDOW_MS);
      setStats({
        dropsTotal: a.dropsTotal,
        dropsPerSec: a.dropTimes.length / (RATE_WINDOW_MS / 1000),
        lateDrops: a.lateDrops,
        badGain: a.badGain,
        captionsPerSecMax: a.captionsPerSecMax,
      });
    }, REFRESH_MS);
    return () => {
      unsubscribe();
      clearInterval(refresh);
    };
  }, []);

  const reset = () => {
    acc.current = { ...EMPTY, dropTimes: [], captionTimes: [] };
    setStats(EMPTY);
  };

  return { stats, reset };
}
