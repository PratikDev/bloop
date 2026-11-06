"use client";

import { useEffect, useState } from "react";
import { loadGistemp, loadGlobalManifest, loadGlobalPlaces, loadGpcp, loadGrace } from "@/lib/data";
import type { BangladeshFiles } from "@/lib/history";
import type { GlobalManifest, GlobalPlacesFile } from "@/types/data-contract";

/** The global place list and its disclosure (optional: without them, Bangladesh only). */
export interface WorldFiles {
  places: GlobalPlacesFile;
  manifest: GlobalManifest;
}

export type HistoryData = { status: "loading" } | { status: "error" } | ({ status: "ready"; world: WorldFiles | null } & BangladeshFiles);

/** Loads the Bangladesh records and the global place list when the History tab first opens. */
export function useHistoryData(): HistoryData {
  const [data, setData] = useState<HistoryData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    const world = Promise.all([loadGlobalPlaces(), loadGlobalManifest()])
      .then(([places, manifest]): WorldFiles => ({ places, manifest }))
      .catch(() => null);
    Promise.all([loadGistemp(), loadGpcp(), loadGrace(), world])
      .then(([gistemp, gpcp, grace, w]) => !cancelled && setData({ status: "ready", gistemp, gpcp, grace, world: w }))
      .catch(() => !cancelled && setData({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
