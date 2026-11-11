"use client";

import { useMemo } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import { useLoaded } from "@/hooks/use-loaded";
import { loadTruthStats } from "@/lib/data";
import { globeProvenance, oceanCardProvenance, rainCardProvenance, rulesProvenance } from "@/lib/provenance/how";
import type { Provenance } from "@/lib/provenance/types";
import type { GlobeDuetFile } from "@/types/data-contract";
import { useAppState, useT } from "../../AppState/use-app-state";
import { useLiveData } from "../../LiveData/use-live-data";
import { PLAYED_VOICES } from "../../panels/MappingPanel";

interface HowFacts {
  ocean: Provenance[];
  rain: Provenance[];
  rules: Provenance[];
  globe: Provenance[];
}

/** "How we got this" for each How we know card, from the same files the cards read. */
export function useHowProvenance(duet: GlobeDuetFile | null): HowFacts {
  const t = useT();
  const { state } = useAppState();
  const { sst, rain } = useLiveData();
  const freshness = useFreshness();
  const { value: stats } = useLoaded(loadTruthStats);
  return useMemo(() => {
    const c = { t, lang: state.lang, freshness, place: null };
    return {
      ocean: sst ? [oceanCardProvenance(c, sst.meta, stats)] : [],
      rain: rain ? [rainCardProvenance(c, rain.meta, stats)] : [],
      rules: [rulesProvenance(c, t("how.rules.title"), PLAYED_VOICES.length)],
      globe: duet?.status === "ok" ? [globeProvenance(c, t("how.globe.title"), duet, stats)] : [],
    };
  }, [t, state.lang, freshness, sst, rain, stats, duet]);
}
