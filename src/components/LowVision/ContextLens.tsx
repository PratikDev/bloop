"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cssVarReader } from "@/lib/css-tokens";
import { FLAGS } from "@/lib/flags";
import { toXY } from "@/lib/geo";
import { loadGeo, type GeoData } from "@/lib/geo/load";
import { formatRainRate, formatTemperature, formatUtc } from "@/lib/i18n";
import { bandIndex, bandLabels } from "@/lib/low-vision/bands";
import { labelOn, resolveVars } from "@/lib/low-vision/scales";
import { cn } from "@/lib/utils";
import { useAppState, useT } from "../AppState/use-app-state";
import { placeNamers } from "../Describe/place-namer";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";
import { bandImage, drawLabels, drawSharp, labelPx } from "./draw";
import { fitSize, LENS_DOCK_ID, place, type Box } from "./lens-place";
import { bandText, UNIT_KEY, useLvMap } from "./use-lv-map";

/** Degrees of longitude the lens shows across (design choice: about six times the map's scale at 320 px). */
const SPAN_DEG = 20;
/** The magnified view's height, as a share of the lens width (2:1, like the map). */
const VIEW_RATIO = 0.5;
/** The overview inset's width, as a share of the lens width. */
const INSET = 0.32;
/** Band labels in the magnified view: at most one per tile of a 3 × 2 grid over it (design choice). */
const LENS_TILES = { x: 3, y: 2 } as const;

/**
 * The Context Lens (accessibility core, step 8; spec 4.1): a magnifier that follows the needle and carries its own
 * context, so nothing important is off-screen when zoomed: the area in sharp, labelled bands; the value at the needle in
 * very large text with its unit, place and time; a scale with the needle's band marked; and an inset of the whole map
 * showing where the lens is. Z turns it on or off, [ and ] resize it (on the map). Visual only: the status region says
 * the same values.
 */
export function ContextLens({ mapRef }: { mapRef: RefObject<HTMLElement | null> }) {
  const { state } = useAppState();
  const t = useT();
  const lv = state.lowVision;
  const { fields } = useLiveData();
  const shown = useShownPoint();
  const map = useLvMap(true);
  const view = useRef<HTMLCanvasElement>(null);
  const inset = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Box | null>(null);
  const [size, setSize] = useState<number>(lv.lensSize);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [geo, setGeo] = useState<GeoData | null>(null);
  const on = FLAGS.lowVision && lv.lens && map !== null;
  useEffect(() => {
    if (on && !geo) void loadGeo().then(setGeo, () => undefined);
  }, [on, geo]);

  const img = useMemo(() => (on && map ? bandImage(map, cssVarReader()) : null), [on, map]);
  const viewH = Math.round(size * VIEW_RATIO);

  // The magnified area (sharp cells), its band edges when asked, the needle's cross; then the overview inset.
  useEffect(() => {
    if (!img || !map || !view.current || !inset.current) return;
    const ctx = view.current.getContext("2d");
    const ictx = inset.current.getContext("2d");
    if (!ctx || !ictx) return;
    const { width: gw, height: gh } = map.grid;
    const cellsX = (SPAN_DEG / 360) * gw;
    const cellsY = cellsX * VIEW_RATIO;
    const cx = ((state.cursor.lon + 180) / 360) * gw;
    const cy = ((90 - state.cursor.lat) / 180) * gh;
    const sx = cx - cellsX / 2;
    const sy = cy - cellsY / 2;
    ctx.fillStyle = cssVarReader()("--night");
    ctx.fillRect(0, 0, size, viewH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, cellsX, cellsY, 0, 0, size, viewH);
    const read = cssVarReader();
    const k = size / cellsX;
    if (lv.edges) {
      // Edge enhancement (lens only): a line wherever neighbouring cells are in different bands.
      ctx.strokeStyle = read("--lv-label-halo");
      ctx.lineWidth = 2;
      ctx.beginPath();
      const band = (c: number, r: number) => (c < 0 || r < 0 || c >= gw || r >= gh ? -2 : bandIndex(map.bands, map.record, map.grid.value(r * gw + c)));
      for (let r = Math.floor(sy); r < sy + cellsY; r++) {
        for (let c = Math.floor(sx); c < sx + cellsX; c++) {
          const b = band(c, r);
          if (band(c + 1, r) !== b) {
            ctx.moveTo((c + 1 - sx) * k, (r - sy) * k);
            ctx.lineTo((c + 1 - sx) * k, (r + 1 - sy) * k);
          }
          if (band(c, r + 1) !== b) {
            ctx.moveTo((c - sx) * k, (r + 1 - sy) * k);
            ctx.lineTo((c + 1 - sx) * k, (r + 1 - sy) * k);
          }
        }
      }
      ctx.stroke();
    }
    // Each band in view labelled with its range, in large text (spec 4.1); data-labels lets the checks read them.
    const fills = resolveVars(map.vars, read);
    const inView = bandLabels(map.grid, map.bands, map.record, LENS_TILES.x, LENS_TILES.y, { c0: sx, r0: sy, c1: sx + cellsX, r1: sy + cellsY });
    const labels = inView.map((l) => ({
      x: ((l.cell % gw) + 0.5 - sx) * k,
      y: (Math.floor(l.cell / gw) + 0.5 - sy) * k,
      text: bandText(t, state.lang, map.bands[l.band]),
      fill: labelOn(fills[l.band]),
      halo: fills[l.band],
    }));
    drawLabels(ctx, labels, labelPx(lv.textScale), getComputedStyle(document.body).fontFamily);
    view.current.dataset.labels = JSON.stringify(inView.map((l, i) => ({ lat: l.lat, lon: l.lon, text: labels[i].text })));
    // The needle: a cross with a dark and a light line, visible on any band.
    for (const [colour, width] of [[read("--ink"), 6], [read("--shapla"), 3]] as const) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(size / 2, viewH / 2, 12, 0, Math.PI * 2);
      ctx.moveTo(size / 2 - 22, viewH / 2);
      ctx.lineTo(size / 2 + 22, viewH / 2);
      ctx.moveTo(size / 2, viewH / 2 - 22);
      ctx.lineTo(size / 2, viewH / 2 + 22);
      ctx.stroke();
    }
    const iw = inset.current.width;
    const ih = inset.current.height;
    drawSharp(ictx, img, iw, ih);
    ictx.strokeStyle = read("--shapla");
    ictx.lineWidth = 2;
    ictx.strokeRect((sx / gw) * iw, (sy / gh) * ih, (cellsX / gw) * iw, (cellsY / gh) * ih);
  }, [img, map, state.cursor, size, viewH, lv.edges, lv.textScale, state.lang, t]);

  // Follow the needle (or keep to the chosen corner, or to the page's slot), re-placed when the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!on) return;
    const update = () => {
      const el = mapRef.current;
      if (!el) return;
      const dock = lv.lensPlace === "docked" ? document.getElementById(LENS_DOCK_ID) : null;
      setSlot(dock);
      const w = dock ? Math.min(lv.lensSize, dock.clientWidth) : fitSize(lv.lensSize);
      setSize(w);
      if (dock) return;
      const r = el.getBoundingClientRect();
      // No slot on this page: a docked lens keeps to the top right.
      const where = lv.lensPlace === "docked" ? "topRight" : lv.lensPlace;
      setPos(place(where, r, toXY(state.cursor, r.width, r.height), w, box.current?.offsetHeight ?? w));
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [on, state.cursor, lv.lensSize, lv.lensPlace, mapRef]);

  if (!on || !map) return null;
  const reading = shown.reading;
  const value = map.record === "ocean" ? (reading?.ocean.valueC ?? null) : (reading?.rain.mmPerHour ?? null);
  const here = bandIndex(map.bands, map.record, value);
  const valueText =
    value === null
      ? t("lv.lens.none")
      : map.record === "rain" && value === 0
        ? t("lv.lens.dry")
        : t("lv.lens.value", { value: map.record === "ocean" ? formatTemperature(value, state.lang) : formatRainRate(value, state.lang), unit: t(UNIT_KEY[map.record]) });
  const meta = map.record === "ocean" ? fields?.sst.meta : fields?.rain?.meta;
  const placeName = placeNamers(geo, state.lang).name(state.cursor) ?? t("place.spoken", state.cursor);

  return createPortal(
    <div
      ref={box}
      aria-hidden="true"
      data-testid="context-lens"
      data-band={here}
      data-place={slot ? "docked" : lv.lensPlace}
      style={slot ? { width: size } : { width: size, left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
      className={cn("pointer-events-none overflow-hidden rounded-plate border-4 border-shapla bg-night text-moon", slot ? "relative" : "fixed z-(--layer-dock) shadow-float")}
    >
      <div className="relative">
        <canvas ref={view} width={size} height={viewH} className="block" data-testid="lens-view" />
        <canvas
          ref={inset}
          width={Math.round(size * INSET)}
          height={Math.round(size * INSET * VIEW_RATIO)}
          data-testid="lens-overview"
          aria-label={t("lv.lens.overview")}
          className="absolute right-1.5 bottom-1.5 border-2 border-moon"
        />
      </div>
      <div className="space-y-1 p-3">
        <p data-testid="lens-value" className="font-sans text-title leading-tight font-bold md:text-headline">
          {valueText}
        </p>
        <p data-testid="lens-place" className="text-body">
          {placeName}
        </p>
        {meta && <p className="text-small text-haze">{formatUtc(meta.frame_time_utc, state.lang)}</p>}
        <ol data-testid="lens-scale" className="mt-2 flex flex-wrap gap-1">
          {map.bands.map((b, i) => (
            <li key={i} data-here={i === here || undefined} className={cn("flex min-w-0 flex-1 basis-14 flex-col items-stretch text-center text-small font-semibold", i === here && "outline-4 outline-offset-1 outline-shapla")}>
              <span className="h-4 border border-moon" style={{ background: `var(${map.vars[i]})` }} />
              <span>{i === here ? `▲ ${bandText(t, state.lang, b)}` : bandText(t, state.lang, b)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>,
    slot ?? document.body,
  );
}
