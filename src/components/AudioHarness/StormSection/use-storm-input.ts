import { useState } from "react";
import type { SweepPoint } from "@/lib/audio";
import { followStorm, loadSequence } from "@/lib/data";
import { syntheticStorm } from "./synthetic";

export interface StormInput {
  source: "synthetic" | "real";
  frames: SweepPoint[];
}

const SYNTHETIC: StormInput = { source: "synthetic", frames: syntheticStorm() };

/**
 * The harness's time-lapse frames: synthetic until "Load real storm", then the
 * real IMERG sequence through L3's own loadSequence() + followStorm() (the
 * same frames L3's UI plays; no second decoder).
 */
export function useStormInput() {
  const [storm, setStorm] = useState<StormInput>(SYNTHETIC);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReal = async () => {
    setError(null);
    try {
      const seq = await loadSequence((loaded, total) => setProgress(`${loaded}/${total}`));
      setStorm({ source: "real", frames: followStorm(seq) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProgress(null);
    }
  };

  return { storm, progress, error, loadReal, useSynthetic: () => setStorm(SYNTHETIC) };
}
