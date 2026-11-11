"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cssVarReader } from "@/lib/css-tokens";
import { sstGrid } from "@/lib/describe/facts";
import { FLAGS } from "@/lib/flags";
import { toXY } from "@/lib/geo";
import { loadGeo, type GeoData } from "@/lib/geo/load";
import { bandLabels } from "@/lib/low-vision/bands";
import { labelOn, resolveVars } from "@/lib/low-vision/scales";
import { useAppState, useT } from "../AppState/use-app-state";
import { placeNamers } from "../Describe/place-namer";
import { useLiveData } from "../LiveData/use-live-data";
import { prepareCanvas, type CanvasSize } from "../FrameView/use-canvas-size";
import { localName } from "../Turntable/place-text";
import { bandImage, drawLabels, drawSharp, drawThickCoast, labelPx, landMask, THICK_COAST_PX, type MapLabel } from "./draw";
import { bandText, useLvMap } from "./use-lv-map";

const TILES = { x: 12, y: 6 } as const;

export function LvMapLayer({ size, rainImage, track }: { size: CanvasSize | null; rainImage: HTMLImageElement | null; track: string }) {
  const { state } = useAppState();
  const t = useT();
  const { fields } = useLiveData();
  const lv = state.lowVision;
  const map = useLvMap();
  const ref = useRef<HTMLCanvasElement>(null);
  const [geo, setGeo] = useState<GeoData | null>(null);
  const wantsCities = FLAGS.lowVision && lv.cities;
  useEffect(() => {
    if (wantsCities && !geo) void loadGeo().then(setGeo, () => undefined);
  }, [wantsCities, geo]);

  const bandsImg = useMemo(() => (map?.recoloured ? bandImage(map, cssVarReader()) : null), [map]);
  const ocean = useMemo(() => (fields ? sstGrid(fields.sst) : null), [fields]);
  const labels = useMemo(() => (map?.recoloured && lv.bands ? bandLabels(map.grid, map.bands, map.record, TILES.x, TILES.y) : []), [map, lv.bands]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !size) return;
    const ctx = prepareCanvas(canvas, size);
    if (!ctx || !FLAGS.lowVision) return;
    const { width: w, height: h } = size;
    const read = cssVarReader();
    if (bandsImg) {
      drawSharp(ctx, bandsImg, w, h);
      if (track === "both" && rainImage) ctx.drawImage(rainImage, 0, 0, w, h);
    }
    if (lv.coast === "thick" && ocean) drawThickCoast(ctx, landMask(ocean, read("--lv-coast")), landMask(ocean, read("--lv-land")), w, h);
    const px = labelPx(lv.textScale);
    const family = getComputedStyle(document.body).fontFamily;
    const out: MapLabel[] = [];
    if (map && bandsImg) {
      const fills = resolveVars(map.vars, read);
      for (const l of labels) out.push({ ...toXY(l, w, h), text: bandText(t, state.lang, map.bands[l.band]), fill: labelOn(fills[l.band]), halo: fills[l.band] });
    }
    const bandCount = out.length;
    if (lv.cities && geo) {
      const label = read("--lv-label");
      const halo = read("--lv-label-halo");
      for (const p of geo.gazetteer.places.filter((x) => x.alwaysLabel)) out.push({ ...toXY(p, w, h), text: localName(p, state.lang).text, fill: label, halo });
      const here = placeNamers(geo, state.lang).name(state.cursor);
      if (here) out.push({ ...toXY(state.cursor, w, h), y: toXY(state.cursor, w, h).y + px * 1.6, text: here.split(",")[0], fill: label, halo });
    }
    drawLabels(ctx, out, px, family);
    canvas.dataset.cities = JSON.stringify(out.slice(bandCount).map((l) => l.text));
    canvas.dataset.coast = lv.coast === "thick" && ocean ? String(THICK_COAST_PX) : "";
    canvas.dataset.labels = JSON.stringify(map && bandsImg ? labels.map((l) => ({ lat: l.lat, lon: l.lon, band: l.band, text: bandText(t, state.lang, map.bands[l.band]) })) : []);
  }, [size, bandsImg, labels, map, lv.coast, lv.cities, lv.textScale, geo, ocean, state.cursor, state.lang, t, track, rainImage]);

  if (!FLAGS.lowVision) return null;
  return <canvas ref={ref} data-testid="lv-map-layer" className="absolute inset-0 size-full" />;
}
