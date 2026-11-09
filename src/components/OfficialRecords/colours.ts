// A decoded layer drawn back with the SVS colorbar's own colours (layer.display): value → nearest colour along the
// colorbar, interpolated on the colorbar's scale. Cells with no data stay transparent; below-range cells take the
// colorbar's first colour.

import { decodeCode, type OfficialGrid } from "@/lib/data";

type Rgb = [number, number, number];

const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** value → colour index along the colorbar (binary search on the sampled values). */
function colourIndex(values: number[], scale: "linear" | "log", v: number): number {
  const f = scale === "log" ? Math.log10 : (x: number) => x;
  const x = f(v);
  let lo = 0;
  let hi = values.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (f(values[mid]) <= x) lo = mid;
    else hi = mid;
  }
  return Math.abs(f(values[lo]) - x) <= Math.abs(f(values[hi]) - x) ? lo : hi;
}

/** One time step as RGBA pixels at the layer's own grid size. */
export function stepImage(grid: OfficialGrid, step: number): ImageData | null {
  const { layer } = grid;
  if (!layer.display) return null;
  const { width, height } = layer.grid;
  const colours = layer.display.colours.map(hex);
  const img = new ImageData(width, height);
  const codes = grid.steps[step];
  for (let i = 0; i < codes.length; i++) {
    const r = decodeCode(layer, codes[i]);
    if (!r) continue;
    const c = colours[r.below ? 0 : colourIndex(layer.display.values, layer.display.scale, r.value)];
    img.data.set([c[0], c[1], c[2], 255], i * 4);
  }
  return img;
}
