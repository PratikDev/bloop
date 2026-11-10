"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import type { LatLon } from "@/lib/data";
import { loadFirms } from "@/lib/data/context";
import { classAt } from "@/lib/earth/class-grid";
import { LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { boxCentre } from "@/lib/earth/firms";
import { loadLandslide } from "@/lib/earth/landslide";
import { activeRegions } from "@/lib/earth/regions";
import { createRumbleLayer } from "@/lib/earth/sound/rumble-layer";
import { loadGeo } from "@/lib/geo/load";
import { useRecordPlay } from "../use-record-play";

/** A one-click place: its words and where it is (from the files and the app's gazetteer, never typed). */
export interface SlidePlace {
  id: string;
  at: LatLon;
}

const COX = "Cox's Bazar";

/** The places P3 offers: the Hill Tracts (FIRMS's CHT box, its centre) and Cox's Bazar (the gazetteer's). */
async function loadPlaces(): Promise<SlidePlace[]> {
  const [firms, geo] = await Promise.all([loadFirms(), loadGeo()]);
  const out: SlidePlace[] = [];
  if (firms.daily) out.push({ id: "cht", at: boxCentre(firms.daily.boxes.CHT) });
  const cox = geo.gazetteer.search(COX, 1)[0];
  if (cox) out.push({ id: "cox", at: { lat: cox.lat, lon: cox.lon } });
  return out;
}

/** The landslide exposure record (P3): the grid, the needle, the places, and the rumble at the needle. */
export function useLandslides() {
  const { value: grid, error } = useLoaded(loadLandslide);
  const { value: places } = useLoaded(loadPlaces);
  const [needle, setNeedle] = useState<LatLon | null>(null);
  const rumble = useRef(createRumbleLayer(LANDSLIDE_VOICE));
  const stopSound = useCallback(() => rumble.current.stop(), []);
  const play = useRecordPlay(stopSound);
  const at = needle ?? places?.[0]?.at ?? { lat: 0, lon: 0 };
  const code = grid ? classAt(grid, at.lat, at.lon) : null;
  const exposed = useMemo(() => (grid ? activeRegions(grid.meta.grid, grid.codes) : []), [grid]);
  useEffect(() => {
    // HOOK: orchestra (land): the rumble (rumble-layer.ts).
    if (play.playing && code !== null) rumble.current.set(code, at.lon);
  }, [play.playing, code, at.lon]);
  return { grid, error, places, needle: at, setNeedle, code, exposed, ...play };
}
