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

const SCHEME_BANDS: ShownBands = 10;

export interface LvMap {
  record: BandRecord;
  grid: ValueGrid;
  bands: Band[];
  vars: string[];
  recoloured: boolean;
  themeKey: string;
}

export const UNIT_KEY = { ocean: "lv.unit.ocean", rain: "lv.unit.rain" } as const satisfies Record<BandRecord, string>;
export const RECORD_KEY = { ocean: "frame.product.ocean", rain: "frame.product.rain" } as const satisfies Record<BandRecord, string>;

export function bandText(t: BoundT, lang: Lang, b: Band): string {
  return b.hi === null ? t("lv.band.above", { lo: formatAxis(b.lo, lang) }) : t("lv.band.range", { lo: formatAxis(b.lo, lang), hi: formatAxis(b.hi, lang) });
}

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
