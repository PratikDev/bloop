"use client";

import { useEffect, useState } from "react";
import type { Gazetteer } from "@/lib/geo/gazetteer";
import { loadGeo } from "@/lib/geo/load";
import { regionTree, type RegionNode } from "@/lib/geo/regions";

type PlacesState = { status: "loading" } | { status: "error" } | { status: "ready"; tree: RegionNode[]; gazetteer: Gazetteer };

export function usePlaces(open: boolean): PlacesState {
  const [state, setState] = useState<PlacesState>({ status: "loading" });
  const ready = state.status === "ready";
  useEffect(() => {
    if (!open || ready) return;
    let cancelled = false;
    loadGeo().then(
      (geo) => !cancelled && setState({ status: "ready", tree: regionTree(geo.files), gazetteer: geo.gazetteer }),
      () => !cancelled && setState({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [open, ready]);
  return state;
}
