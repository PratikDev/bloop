"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import type { LatLon } from "@/lib/data";
import { classAt } from "@/lib/earth/class-grid";
import { LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { loadLandslide, loadSlidePlaces as loadPlaces } from "@/lib/earth/landslide";
import { activeRegions } from "@/lib/earth/regions";
import { createRumbleLayer } from "@/lib/earth/sound/rumble-layer";
import { useRecordPlay } from "../use-record-play";

export type { SlidePlace } from "@/lib/earth/landslide";

/** The landslide exposure record: the grid, the needle, the places, and the rumble at the needle. */
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
