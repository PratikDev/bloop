"use client";

import { useMemo } from "react";
import { liveRainFrame, sstGrid } from "@/lib/describe/facts";
import type { ValueGrid } from "@/lib/describe/stats";
import { FLAGS } from "@/lib/flags";
import { formatAxis, type BoundT, type Lang } from "@/lib/i18n";
import { bandsFor, LENS_BANDS, type Band, type BandRecord, type ShownBands } from "@/lib/low-vision/bands";
import { bandVars } from "@/lib/low-vision/scales";
import { recoloured } from "@/lib/low-vision/settings";
import { useAppState } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";

/** Re-colouring is always in discrete bands: with bands off, a scheme other than NASA's uses this many (design choice). */
const SCHEME_BANDS: ShownBands = 10;

export interface LvMap {
  record: BandRecord;
  grid: ValueGrid;
  bands: Band[];
  /** Each band's CSS colour variable (canvas code resolves them when it draws). */
  vars: string[];
  /** The map itself is re-coloured (not just the lens). */
  recoloured: boolean;
  /** Changes with the theme's colours, so drawings that resolved the variables redraw. */
  themeKey: string;
}

export const UNIT_KEY = { ocean: "lv.unit.ocean", rain: "lv.unit.rain" } as const satisfies Record<BandRecord, string>;
export const RECORD_KEY = { ocean: "frame.product.ocean", rain: "frame.product.rain" } as const satisfies Record<BandRecord, string>;

/** A band's range in words ("26 to 33", "32 or more"), from its edges. */
export function bandText(t: BoundT, lang: Lang, b: Band): string {
  return b.hi === null ? t("lv.band.above", { lo: formatAxis(b.lo, lang) }) : t("lv.band.range", { lo: formatAxis(b.lo, lang), hi: formatAxis(b.hi, lang) });
}

/**
 * The live frame on the map as low-vision bands (accessibility core, step 8): the decoded grid the sound plays, its
 * bands and their colours. `lens`: the lens always draws bands, even when the map shows NASA's colours. Null while
 * the frames load, during the storm time-lapse (its frames show as NASA drew them), or with the flag off.
 */
export function useLvMap(lens = false): LvMap | null {
  const { state } = useAppState();
  const { fields } = useLiveData();
  const shown = useShownPoint();
  const lv = state.lowVision;
  const record: BandRecord = shown.track === "rain" && fields?.rain ? "rain" : "ocean";
  const isRecoloured = recoloured(lv);
  const count: ShownBands | 0 = lv.bands || (lv.scheme !== "original" ? SCHEME_BANDS : lens ? LENS_BANDS : 0);
  const playing = shown.timelapse !== null && shown.timelapse !== undefined;
  const themeKey = `${lv.theme}|${lv.customText}|${lv.customBackground}`;
  return useMemo(() => {
    if (!FLAGS.lowVision || !fields || playing || count === 0) return null;
    const grid = record === "rain" && fields.rain ? liveRainFrame(fields.rain).grid : sstGrid(fields.sst);
    const bands = bandsFor(record, grid, count);
    return { record, grid, bands, vars: bandVars(lv.scheme, bands.length), recoloured: isRecoloured, themeKey };
  }, [fields, record, count, lv.scheme, isRecoloured, playing, themeKey]);
}
