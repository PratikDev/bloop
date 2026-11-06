import { useEffect, useState } from "react";
import { readPeakDb } from "@/lib/audio/dev";

const METER_INTERVAL_MS = 100;

/** Current and highest output peak (dBFS) while audio is running. Visual only. */
export function usePeakMeter(ready: boolean) {
  const [peakDb, setPeakDb] = useState(-Infinity);
  const [maxDb, setMaxDb] = useState(-Infinity);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const db = readPeakDb();
      setPeakDb(db);
      setMaxDb((m) => Math.max(m, db));
    }, METER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [ready]);

  return { peakDb, maxDb, resetMax: () => setMaxDb(-Infinity) };
}
