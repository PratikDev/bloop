"use client";

import { useEffect, useState } from "react";
import type { LatLon } from "@/lib/data";
import { loadGeo } from "@/lib/geo/load";
import { useAppState } from "../AppState/use-app-state";
import { ttFor } from "../Turntable/i18n";
import { placeText } from "../Turntable/place-text";

export function usePlaceNames(points: readonly LatLon[]): string[] | null {
  const { state } = useAppState();
  const [names, setNames] = useState<string[] | null>(null);
  const key = points.map((p) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`).join(";");
  useEffect(() => {
    let cancelled = false;
    loadGeo()
      .then((g) => !cancelled && setNames(points.map((p) => placeText(ttFor(state.lang), state.lang, g.gazetteer.whereAmI(p), true).line)))
      .catch(() => !cancelled && setNames(null));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state.lang]);
  return names;
}
