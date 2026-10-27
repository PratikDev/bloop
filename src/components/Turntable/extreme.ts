// The hottest (Ocean) or wettest (Rain) cell on the needle's groove within the
// part of the globe facing the camera, read with the same valueAt() as the
// sound. When the needle reaches it, the existing "ping" earcon plays (caption:
// "Ping: the extreme value in view") and a sparkle shows.

import type { TrackMode } from "@/lib/audio-adapter/types";
import { cellIndex, wrapLon, type GridSize } from "@/lib/data/grid";
import { valueAt, type LiveFields } from "@/lib/data";

/** Half-width of "in view" on the groove, degrees of longitude either side of the camera's sub-point. */
const VIEW_HALF_WIDTH_DEG = 70;

export interface Extreme {
  cell: number; // flat index in that track's grid
  lon: number;
}

/** Which grid an extreme is found in: Ocean (and Ocean + Rain) uses SST, Rain uses rain. */
export function extremeTrack(track: TrackMode): "ocean" | "rain" {
  return track === "rain" ? "rain" : "ocean";
}

function gridOf(fields: LiveFields, which: "ocean" | "rain"): GridSize | null {
  return which === "ocean" ? fields.sst.meta.grid : (fields.rain?.meta.grid ?? null);
}

/** The needle's cell in the grid the extreme is searched in. */
export function needleCell(fields: LiveFields, track: TrackMode, lat: number, lon: number): number | null {
  const grid = gridOf(fields, extremeTrack(track));
  return grid ? cellIndex(grid, lat, lon) : null;
}

export function grooveExtreme(fields: LiveFields, track: TrackMode, lat: number, viewLon: number): Extreme | null {
  const which = extremeTrack(track);
  const grid = gridOf(fields, which);
  if (!grid) return null;
  const step = 360 / grid.width;
  let best: Extreme | null = null;
  let bestValue = -Infinity;
  for (let col = 0; col < grid.width; col++) {
    const lon = -180 + (col + 0.5) * step;
    if (Math.abs(wrapLon(lon - viewLon)) > VIEW_HALF_WIDTH_DEG) continue;
    const value = which === "ocean" ? valueAt(fields, "ocean", lat, lon).valueC : valueAt(fields, "rain", lat, lon).mmPerHour;
    if (value === null || value <= bestValue || (which === "rain" && value === 0)) continue;
    bestValue = value;
    best = { cell: cellIndex(grid, lat, lon), lon };
  }
  return best;
}
