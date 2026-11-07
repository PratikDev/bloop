// A grid cell's centre as the files give it (e.g. 23.75° N, 91.25° E), for every "How we got this" builder.

import { formatFixed, type BoundT, type Lang } from "@/lib/i18n";

const CELL_DECIMALS = 2;

const deg = (v: number, lang: Lang, pos: string, neg: string) => `${formatFixed(Math.abs(v), lang, CELL_DECIMALS)}° ${v >= 0 ? pos : neg}`;

export const cellCentre = (t: BoundT, lang: Lang, lat: number, lon: number) =>
  t("hwgt.cell.centre", { lat: deg(lat, lang, "N", "S"), lon: deg(lon, lang, "E", "W") });
