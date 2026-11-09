"use client";

import { useMemo } from "react";
import { nearestIndex, voiceScale, type BrailleSource, type ShapeMode, type ShapePoint, type ShapeScale } from "@/a11y/brailleSource";
import { clean } from "@/a11y/brailleText";
import type { LatLon } from "@/lib/data";
import type { OfficialChannel, OfficialLayer } from "@/types/data-contract";
import { GRID_SPAN, PATH_MAX, RELATIVE, officialReading } from "./braille-lines";
import { channelReading, type OfficialRecordState } from "./use-official-record";

/** An official or related record as a braille source: its play option's voices at the record's needle. */
export function useOfficialBrailleSource(rec: OfficialRecordState): BrailleSource | null {
  const { manifest, option, grids, ready, step, steps, needle, moveNeedle, setStep } = rec;

  return useMemo<BrailleSource | null>(() => {
    if (!manifest || !option || !ready) return null;
    const channelOf = (voice: string): OfficialChannel => option.channels.find((c) => c.voice === voice) ?? option.channels[0];
    const layerOf = (voice: string): OfficialLayer => grids[channelOf(voice).layers[0]]?.layer ?? grids[option.map].layer;
    const status = layerOf(option.channels[0]?.voice ?? "").status;
    const relative = RELATIVE.includes(status);
    const read = (voice: string, s: number, at: LatLon) => {
      const c = channelOf(voice);
      return channelReading(grids, c.layers, c.combine, s, at);
    };
    const point = (voice: string, s: number, at: LatLon): ShapePoint => ({ value: read(voice, s, at)?.value ?? null, at, step: s });

    const pointsFor = (voice: string, mode: ShapeMode): ShapePoint[] => {
      const layer = layerOf(voice);
      const [west, south, east, north] = layer.grid.bounds;
      if (mode === "time") return Array.from({ length: steps }, (_, s) => point(voice, s, needle));
      if (mode === "path") {
        const n = Math.min(PATH_MAX, layer.grid.width);
        const dx = (east - west) / n;
        return Array.from({ length: n }, (_, i) => point(voice, step, { lat: needle.lat, lon: west + dx * (i + 0.5) }));
      }
      const dx = (east - west) / (3 * GRID_SPAN);
      const dy = (north - south) / (3 * GRID_SPAN);
      const centre = (v: number, lo: number, d: number) => lo + (Math.floor((v - lo) / (3 * d)) + 0.5) * 3 * d;
      const cLon = centre(needle.lon, west, dx);
      const cLat = centre(needle.lat, south, dy);
      return [1, 0, -1].flatMap((r) => [-1, 0, 1].map((c) => point(voice, step, { lat: cLat + r * dy, lon: cLon + c * dx })));
    };
    const fallback = (voice: string): ShapeScale => {
      const layer = layerOf(voice);
      const [min, max] = layer.value_range ?? [0, 1];
      return { min, max: max > min ? max : min + 1, scale: layer.encoding === "log10" ? "log" : "linear", unit: layer.unit };
    };
    return {
      key: `official-${manifest.record}-${option.id}`,
      channels: option.channels.map((c) => ({ id: c.voice, label: clean(layerOf(c.voice).label) })),
      relative,
      modes: () => (steps > 1 ? ["time", "path", "grid"] : ["path", "grid"]),
      scale: (voice) => {
        const s = voiceScale(voice, fallback(voice));
        return { ...s, unit: layerOf(voice).unit };
      },
      view(voice, mode) {
        const points = pointsFor(voice, mode);
        return { mode, points, columns: mode === "grid" ? 3 : undefined, current: nearestIndex(points, needle, step, mode) };
      },
      reading(voice) {
        return officialReading(manifest, layerOf(voice), read(voice, step, needle), needle, step);
      },
      go(_voice, mode, p) {
        if (mode === "time") setStep(p.step);
        else moveNeedle(p.at);
      },
    };
  }, [manifest, option, grids, ready, step, steps, needle, moveNeedle, setStep]);
}
