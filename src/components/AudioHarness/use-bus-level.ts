import { useEffect, useState } from "react";
import { isDucked, readSonificationLevel } from "@/lib/audio/dev";

const POLL_MS = 100;

/** The sonification bus level and ducked flag, polled for display (visual only). */
export function useBusLevel(ready: boolean) {
  const [level, setLevel] = useState(1);
  const [ducked, setDucked] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setLevel(readSonificationLevel());
      setDucked(isDucked());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [ready]);

  return { level, ducked };
}
