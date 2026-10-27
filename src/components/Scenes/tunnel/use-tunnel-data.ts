"use client";

import { useEffect, useState } from "react";
import type { TunnelYear } from "@/lib/audio-adapter/types";
import { loadDemo, loadGistemp, loadGpcp } from "@/lib/data";
import type { DhakaThenNowDemo, GistempContextFile, RainContextFile } from "@/types/data-contract";
import { tunnelYears } from "./rows";

export interface TunnelData {
  rows: TunnelYear[];
  demo: DhakaThenNowDemo;
  gistemp: GistempContextFile;
  gpcp: RainContextFile;
}

/** GISTEMP and GPCP for the Dhaka cell, and the demo's windows and captions. */
export function useTunnelData(): { data: TunnelData | null; error: boolean } {
  const [data, setData] = useState<TunnelData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGistemp(), loadGpcp(), loadDemo()])
      .then(([gistemp, gpcp, demo]) => !cancelled && setData({ rows: tunnelYears(gistemp.cells.Dhaka, gpcp.cells.Dhaka), demo, gistemp, gpcp }))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);
  return { data, error };
}
