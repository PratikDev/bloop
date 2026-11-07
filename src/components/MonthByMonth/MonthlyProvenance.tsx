"use client";

import { useMemo } from "react";
import { useFreshness } from "@/hooks/use-freshness";
import type { HistoryMetric, PlaceSeries } from "@/lib/history";
import { monthlyProvenance } from "@/lib/provenance/monthly";
import type { GraceContextFile } from "@/types/data-contract";
import { useAppState, useT } from "../AppState/use-app-state";
import { HowWeGotThis } from "../HowWeGotThis";

/** "How we got this" for the monthly record on screen (mentor item 11). */
export function MonthlyProvenance(p: { metric: HistoryMetric; placeName: string; world: boolean; series: PlaceSeries; grace: GraceContextFile }) {
  const t = useT();
  const { state } = useAppState();
  const freshness = useFreshness();
  const { metric, placeName, world, series, grace } = p;
  const facts = useMemo(
    () => [monthlyProvenance({ t, lang: state.lang, freshness, metric, placeName, world, series, grace })],
    [t, state.lang, freshness, metric, placeName, world, series, grace],
  );
  return <HowWeGotThis facts={facts} />;
}
