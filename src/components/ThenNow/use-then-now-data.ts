"use client";

import { useEffect, useState } from "react";
import { loadCities, loadDemo, loadGrace } from "@/lib/data";
import type { CitiesThenNowFile, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";

export type ThenNowData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; demo: DhakaThenNowDemo; grace: GraceContextFile; cities: CitiesThenNowFile | null };

/**
 * Loads the demo and GRACE files the first time Then vs Now opens, and the
 * optional cities file (contract §13). Without the cities file, Dhaka alone shows.
 */
export function useThenNowData(): ThenNowData {
  const [data, setData] = useState<ThenNowData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDemo(), loadGrace(), loadCities().catch(() => null)])
      .then(([demo, grace, cities]) => !cancelled && setData({ status: "ready", demo, grace, cities }))
      .catch(() => !cancelled && setData({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
