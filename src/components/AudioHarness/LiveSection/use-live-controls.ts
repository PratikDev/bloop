import { useCallback, useRef, useState } from "react";
import { setOcean, setRain, setTrackMode, type RainPhase, type TrackMode } from "@/lib/audio";

export interface OceanInput {
  valueC: number;
  noData: boolean;
  lon: number;
}

export interface RainInput {
  mmPerHour: number;
  phase: RainPhase;
  lon: number;
}

const INITIAL_OCEAN: OceanInput = { valueC: 20, noData: false, lon: 90 };
const INITIAL_RAIN: RainInput = { mmPerHour: 5, phase: "liquid", lon: 90 };

/** The harness's stand-in for L3's cursor: every change goes straight to the live voices. */
export function useLiveControls() {
  const [ocean, setOceanState] = useState(INITIAL_OCEAN);
  const [rain, setRainState] = useState(INITIAL_RAIN);
  const [mode, setMode] = useState<TrackMode>("both");
  const oceanRef = useRef(INITIAL_OCEAN);
  const rainRef = useRef(INITIAL_RAIN);

  const updateOcean = useCallback((patch: Partial<OceanInput>) => {
    const next = { ...oceanRef.current, ...patch };
    oceanRef.current = next;
    setOceanState(next);
    setOcean(next.noData ? null : next.valueC, next.lon);
  }, []);

  const updateRain = useCallback((patch: Partial<RainInput>) => {
    const next = { ...rainRef.current, ...patch };
    rainRef.current = next;
    setRainState(next);
    const mm = next.phase === "nodata" ? null : next.phase === "dry" ? 0 : next.mmPerHour;
    setRain(mm, next.phase, next.lon);
  }, []);

  const changeMode = useCallback((next: TrackMode) => {
    setMode(next);
    setTrackMode(next);
  }, []);

  return { ocean, rain, mode, oceanRef, updateOcean, updateRain, changeMode };
}
