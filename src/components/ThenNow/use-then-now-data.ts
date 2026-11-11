"use client";

import { useEffect, useState } from "react";
import { loadCities, loadDemo, loadGrace, loadThenNowStats } from "@/lib/data";
import type { CitiesThenNowFile, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";

type ThenNowData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; demo: DhakaThenNowDemo; grace: GraceContextFile; cities: CitiesThenNowFile | null; stats: ThenNowStatsFile | null };

export function useThenNowData(): ThenNowData {
  const [data, setData] = useState<ThenNowData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDemo(), loadGrace(), loadCities().catch(() => null), loadThenNowStats().catch(() => null)])
      .then(([demo, grace, cities, stats]) => !cancelled && setData({ status: "ready", demo, grace, cities, stats }))
      .catch(() => !cancelled && setData({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
