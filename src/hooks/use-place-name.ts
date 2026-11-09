"use client";

import { useMemo } from "react";
import { useAppState } from "@/components/AppState/use-app-state";
import { ttFor, useTT } from "@/components/Turntable/i18n";
import { placeText } from "@/components/Turntable/place-text";
import { useLoaded } from "@/hooks/use-loaded";
import type { LatLon } from "@/lib/data";
import { loadGazetteer } from "@/lib/geo/load-files";

/** The name of a place on Earth ("Bay of Bengal", "Dhaka, Bangladesh"), or null until the gazetteer has loaded (after Start). */
export function usePlaceName(at: LatLon): string | null {
  const { state } = useAppState();
  const { lang } = useTT();
  const gazetteer = useLoaded(loadGazetteer, state.started).value;
  const { lat, lon } = at;
  return useMemo(() => (gazetteer ? placeText(ttFor(lang), lang, gazetteer.whereAmI({ lat, lon })).name : null), [gazetteer, lang, lat, lon]);
}
