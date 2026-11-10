// The class products' grids (contract-15 fire.ts / disasters.ts): SVS 5315 fire-weather classes and SVS 5584 LHASA
// exposure classes, each a Uint8 1024×512 equirectangular grid (row 0 = 90° N, column 0 = 180° W) whose codes are the
// JSON's `classes`. Pure helpers plus the loader; the codes are read as the pipeline wrote them, never re-derived.

import { fetchBuffer, fetchJson } from "@/lib/data/fetch";
import { cellIndex, readUint8, type GridSize } from "@/lib/data/grid";
import { gunzip } from "@/lib/data/gunzip";
import type { ClassCode, ProductHeader } from "@/types/data-contract";

/** The parts of a class product's metadata every helper needs. */
export interface ClassMeta extends ProductHeader {
  classes: ClassCode[];
  grid: GridSize & { nodata: number; encoding: string };
}

export interface ClassGrid<M extends ClassMeta = ClassMeta> {
  meta: M;
  codes: Uint8Array;
}

/** [west, south, east, north] in degrees. */
export type Box = readonly [number, number, number, number];

export function checkClassMeta(name: string, meta: ClassMeta): void {
  if (meta.grid.encoding !== "uint8_class") throw new Error(`${name}: encoding "${meta.grid.encoding}" is not uint8_class`);
  if (!Array.isArray(meta.classes) || meta.classes.length === 0) throw new Error(`${name}: no classes`);
}

/** A class grid's codes (raw .bin, or a gzip such as the FWI archive's days), checked against the grid's size. */
export const loadCodes = async (url: string, size: GridSize): Promise<Uint8Array> => readUint8(await gunzip(await fetchBuffer(url)), size);

/** Loads a class product: its JSON and its grid. */
export async function loadClassGrid<M extends ClassMeta>(metaUrl: string, gridUrl: string): Promise<ClassGrid<M>> {
  const meta = await fetchJson<M>(metaUrl);
  checkClassMeta(metaUrl, meta);
  return { meta, codes: await loadCodes(gridUrl, meta.grid) };
}

/** The class code of the cell containing (lat, lon). */
export const classAt = (g: ClassGrid, lat: number, lon: number): number => g.codes[cellIndex(g.meta.grid, lat, lon)];

/** A code's label as the product's JSON spells it; null for a code the JSON doesn't list. */
export const classLabel = (meta: Pick<ClassMeta, "classes">, code: number): string | null => meta.classes.find((c) => c.code === code)?.label ?? null;

/** Cells per class code inside a box (every cell whose centre is in it). */
export function boxCounts(size: GridSize, codes: Uint8Array, box: Box): Map<number, number> {
  const [w, s, e, n] = box;
  const out = new Map<number, number>();
  for (let r = 0; r < size.height; r++) {
    const lat = 90 - ((r + 0.5) / size.height) * 180;
    if (lat < s || lat > n) continue;
    for (let c = 0; c < size.width; c++) {
      const lon = -180 + ((c + 0.5) / size.width) * 360;
      if (lon < w || lon > e) continue;
      const code = codes[r * size.width + c];
      out.set(code, (out.get(code) ?? 0) + 1);
    }
  }
  return out;
}

/** The most common class among a box's valid cells (code ≠ nodata); null when it has none. Ties go to the higher class. */
export function modalClass(size: GridSize & { nodata: number }, codes: Uint8Array, box: Box): number | null {
  let best: number | null = null;
  let most = 0;
  for (const [code, n] of boxCounts(size, codes, box)) {
    if (code === size.nodata) continue;
    if (n > most || (n === most && best !== null && code > best)) {
      best = code;
      most = n;
    }
  }
  return best;
}

/** The highest class among a box's cells; null when it has no valid cell. */
export function maxClass(size: GridSize & { nodata: number }, codes: Uint8Array, box: Box): number | null {
  let best: number | null = null;
  for (const code of boxCounts(size, codes, box).keys()) if (code !== size.nodata && (best === null || code > best)) best = code;
  return best;
}
