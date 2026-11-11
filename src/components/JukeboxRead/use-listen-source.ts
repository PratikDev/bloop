"use client";

import { useEffect, useMemo, useState } from "react";
import { voiceSpec } from "@/lib/audio/mapping";
import { latestRainSource, sequenceRainSource, sstSource, type ReadSource } from "@/lib/cv/read-source";
import { loadSequenceFrame } from "@/lib/data";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";

type Held = { size: { width: number; height: number }; codes: Uint8Array; timeUtc: string } | null;

export function useListenSource(): { source: ReadSource | null; loading: boolean; record: "ocean" | "rain" } {
  const { state } = useAppState();
  const { sst, rain } = useLiveData();
  const [held, setHeld] = useState<Held>(null);
  const record = state.track === "rain" || state.heldFrame !== null ? "rain" : "ocean";
  useEffect(() => {
    let cancelled = false;
    if (state.heldFrame === null) return;
    loadSequenceFrame(state.heldFrame)
      .then((f) => !cancelled && setHeld(f ? { size: { width: f.index.grid.width, height: f.index.grid.height }, codes: f.frame.codes, timeUtc: f.frame.ref.time_utc } : null))
      .catch(() => !cancelled && setHeld(null));
    return () => {
      cancelled = true;
    };
  }, [state.heldFrame]);
  const lang = state.lang;
  const source = useMemo(() => {
    const label = voiceSpec(record).label[lang];
    if (record === "ocean") return sst ? sstSource(sst, label) : null;
    if (state.heldFrame !== null) return held ? sequenceRainSource(held.size, held.codes, held.timeUtc, label) : null;
    return rain ? latestRainSource(rain, label) : null;
  }, [record, lang, sst, rain, held, state.heldFrame]);
  return { source, loading: !source, record };
}
