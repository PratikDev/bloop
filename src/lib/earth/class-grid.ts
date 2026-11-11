import { fetchBuffer, fetchJson } from "@/lib/data/fetch";
import { cellIndex, readUint8, type GridSize } from "@/lib/data/grid";
import { gunzip } from "@/lib/data/gunzip";
import type { ClassCode, ProductHeader } from "@/types/data-contract";

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

function checkClassMeta(name: string, meta: ClassMeta): void {
  if (meta.grid.encoding !== "uint8_class") throw new Error(`${name}: encoding "${meta.grid.encoding}" is not uint8_class`);
  if (!Array.isArray(meta.classes) || meta.classes.length === 0) throw new Error(`${name}: no classes`);
}

export const loadCodes = async (url: string, size: GridSize): Promise<Uint8Array> => readUint8(await gunzip(await fetchBuffer(url)), size);

export async function loadClassGrid<M extends ClassMeta>(metaUrl: string, gridUrl: string): Promise<ClassGrid<M>> {
  const meta = await fetchJson<M>(metaUrl);
  checkClassMeta(metaUrl, meta);
  return { meta, codes: await loadCodes(gridUrl, meta.grid) };
}

export const classAt = (g: ClassGrid, lat: number, lon: number): number => g.codes[cellIndex(g.meta.grid, lat, lon)];

export const classLabel = (meta: Pick<ClassMeta, "classes">, code: number): string | null => meta.classes.find((c) => c.code === code)?.label ?? null;

function boxCounts(size: GridSize, codes: Uint8Array, box: Box): Map<number, number> {
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

export function nearestOfClass(size: GridSize, codes: Uint8Array, code: number, lat: number, lon: number): { lat: number; lon: number } | null {
  const at = cellIndex(size, lat, lon);
  const r0 = Math.floor(at / size.width);
  const c0 = at % size.width;
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < codes.length; i++) {
    if (codes[i] !== code) continue;
    const dr = Math.floor(i / size.width) - r0;
    const dcRaw = Math.abs((i % size.width) - c0);
    const dc = Math.min(dcRaw, size.width - dcRaw);
    const d = dr * dr + dc * dc;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  if (best < 0) return null;
  return { lat: 90 - ((Math.floor(best / size.width) + 0.5) / size.height) * 180, lon: -180 + (((best % size.width) + 0.5) / size.width) * 360 };
}
