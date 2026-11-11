// "The 3 most active fire-weather regions in the current grid, found by the code": the grid is cut into blocks
// of BLOCK_DEG; a block with enough land forecast (MIN_VALID_SHARE of its cells) is scored by its mean class; the top
// blocks that don't touch each other are offered as one-click places, each at the centre of its highest-class cells.
// Pure: a class grid in, places out. The block size and share are design choices, not data.

import type { GridSize } from "@/lib/data/grid";

const BLOCK_DEG = 10;
const MIN_VALID_SHARE = 0.25;
/** Blocks this many blocks apart or less (in either direction) count as the same region. */
const NEIGHBOUR = 1;

interface ActiveRegion {
  lat: number;
  lon: number;
  /** Mean class over the block's forecast cells. */
  meanClass: number;
  /** The block's highest class. */
  topClass: number;
}

interface Block {
  bx: number;
  by: number;
  mean: number;
  top: number;
  topCells: number;
  lat: number;
  lon: number;
}

function scoreBlocks(size: GridSize & { nodata: number }, codes: Uint8Array): Block[] {
  const cw = Math.round((size.width * BLOCK_DEG) / 360);
  const ch = Math.round((size.height * BLOCK_DEG) / 180);
  const blocks: Block[] = [];
  for (let by = 0; by * ch < size.height; by++) {
    for (let bx = 0; bx * cw < size.width; bx++) {
      let sum = 0;
      let n = 0;
      let top = 0;
      let topCells = 0;
      let latSum = 0;
      let lonSum = 0;
      for (let r = by * ch; r < Math.min(size.height, (by + 1) * ch); r++) {
        for (let c = bx * cw; c < Math.min(size.width, (bx + 1) * cw); c++) {
          const code = codes[r * size.width + c];
          if (code === size.nodata) continue;
          sum += code;
          n += 1;
          const lat = 90 - ((r + 0.5) / size.height) * 180;
          const lon = -180 + ((c + 0.5) / size.width) * 360;
          if (code > top) {
            top = code;
            topCells = 0;
            latSum = 0;
            lonSum = 0;
          }
          if (code === top) {
            topCells += 1;
            latSum += lat;
            lonSum += lon;
          }
        }
      }
      if (n < cw * ch * MIN_VALID_SHARE) continue;
      blocks.push({ bx, by, mean: sum / n, top, topCells, lat: latSum / topCells, lon: lonSum / topCells });
    }
  }
  return blocks;
}

/** The `count` most active regions, most active first (fewer if the grid has fewer distinct regions). */
export function activeRegions(size: GridSize & { nodata: number }, codes: Uint8Array, count = 3): ActiveRegion[] {
  const ranked = scoreBlocks(size, codes).sort((a, b) => b.mean - a.mean || b.top - a.top || b.topCells - a.topCells);
  const chosen: Block[] = [];
  for (const b of ranked) {
    if (chosen.length === count) break;
    if (chosen.some((c) => Math.abs(c.bx - b.bx) <= NEIGHBOUR && Math.abs(c.by - b.by) <= NEIGHBOUR)) continue;
    chosen.push(b);
  }
  return chosen.map((b) => ({ lat: b.lat, lon: b.lon, meanClass: b.mean, topClass: b.top }));
}
