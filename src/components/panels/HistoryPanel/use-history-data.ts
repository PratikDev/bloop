"use client";

import { useEffect, useState } from "react";
import { loadGistemp, loadGpcp } from "@/lib/data";
import type { GistempContextFile, RainContextFile } from "@/types/data-contract";

export type HistoryData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; gistemp: GistempContextFile; gpcp: RainContextFile };

/** Loads the GISTEMP and GPCP context files when the History tab first opens. */
export function useHistoryData(): HistoryData {
  const [data, setData] = useState<HistoryData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGistemp(), loadGpcp()])
      .then(([gistemp, gpcp]) => !cancelled && setData({ status: "ready", gistemp, gpcp }))
      .catch(() => !cancelled && setData({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
