"use client";

import { useMemo } from "react";
import { useAppState, useT } from "@/components/AppState/use-app-state";
import { useLiveData } from "@/components/LiveData/use-live-data";
import type { TrackMode } from "@/lib/audio-jukebox/types";
import { gapProvenance, oceanProvenance, rainProvenance } from "@/lib/provenance/live";
import type { Provenance } from "@/lib/provenance/types";
import { useFreshness } from "./use-freshness";

/** "How we got this" for the live frames a track plays (Listen, the frame label, the Turntable): the ocean and/or rain
 * frame, and in Both mode the time between them. `place` is the cursor's place as shown, or null. */
export function useLiveProvenance(track: TrackMode, place: string | null, { gap = true }: { gap?: boolean } = {}): Provenance[] {
  const t = useT();
  const { state } = useAppState();
  const { sst, rain } = useLiveData();
  const freshness = useFreshness();
  return useMemo(() => {
    const c = { t, lang: state.lang, freshness, place };
    const out: Provenance[] = [];
    if (track !== "rain" && sst) out.push(oceanProvenance(c, sst.meta));
    if (track !== "ocean" && rain) out.push(rainProvenance(c, rain.meta));
    const g = gap && track === "both" && sst && rain ? gapProvenance(c, sst.meta, rain.meta) : null;
    if (g) out.push(g);
    return out;
  }, [t, state.lang, freshness, place, track, sst, rain, gap]);
}
