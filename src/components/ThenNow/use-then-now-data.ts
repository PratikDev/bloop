"use client";

import { useEffect, useState } from "react";
import type { ThenNowInput } from "@/lib/audio-adapter/types";
import { loadDemo, loadGrace } from "@/lib/data";
import { buildThenNowInput } from "@/lib/then-now";
import type { DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";

export type ThenNowData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; demo: DhakaThenNowDemo; grace: GraceContextFile; input: ThenNowInput };

/** Loads the demo and GRACE files the first time Then vs Now opens. */
export function useThenNowData(): ThenNowData {
  const [data, setData] = useState<ThenNowData>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDemo(), loadGrace()])
      .then(([demo, grace]) => !cancelled && setData({ status: "ready", demo, grace, input: buildThenNowInput(demo, grace) }))
      .catch(() => !cancelled && setData({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
