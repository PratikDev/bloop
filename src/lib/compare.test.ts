// Accessibility core, step 6: "Compare two dates" reads the right cell and months, and its difference is b − a from the
// file itself (a hand-made layer with known values, then the shipped GISTEMP layer at Dhaka).
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { CUBE_NO_DATA, type GlobalLayer } from "@/lib/data/global";
import type { GlobalLayerFile } from "@/types/data-contract";
import { compareAt, defaultMonths, layerYears, rowAt } from "./compare";

/** A 2 × 2 layer (lat 45, −45; lon −90, 90), three months from 2020-01; cell 3 has no row. */
function tiny(): GlobalLayer {
  const meta = { scale: 100, month_start: "2020-01", n_months: 3, grid: { lat: [45, -45], lon: [-90, 90] }, cells: [0, 1, 2] } as unknown as GlobalLayerFile;
  const values = new Int16Array([100, 150, CUBE_NO_DATA, -50, 0, 25, 7, 8, 9]);
  const rowOf = new Int32Array([0, 1, 2, -1]);
  return { meta, months: ["2020-01", "2020-02", "2020-03"], values, rowOf };
}

describe("compare two dates", () => {
  test("the cell around the needle, both months, and b − a", () => {
    const r = compareAt(tiny(), "heat", { lat: 40, lon: 80 }, "2020-01", "2020-03");
    expect(r.cell).toEqual({ lat: 45, lon: 90 });
    expect(r.a).toEqual({ month: "2020-01", value: -0.5 });
    expect(r.b).toEqual({ month: "2020-03", value: 0.25 });
    expect(r.diff).toBeCloseTo(0.75, 10);
  });

  test("no data on either side: no difference; a cell the layer lacks has no row", () => {
    expect(compareAt(tiny(), "heat", { lat: 40, lon: -80 }, "2020-01", "2020-03").diff).toBeNull();
    expect(rowAt(tiny(), { lat: -40, lon: 80 })).toBe(-1);
    expect(compareAt(tiny(), "heat", { lat: -40, lon: 80 }, "2020-01", "2020-02").a.value).toBeNull();
  });

  test("defaults: the newest month and the same calendar month in the first year", () => {
    expect(defaultMonths(tiny())).toEqual({ a: "2020-03", b: "2020-03" });
    expect(layerYears(tiny())).toEqual([2020]);
  });

  test("the shipped land-temperature layer at Dhaka: a value read straight from the file", () => {
    const dir = join(import.meta.dir, "../../public/data/global");
    const meta = JSON.parse(readFileSync(join(dir, "heat.json"), "utf8")) as GlobalLayerFile;
    const raw = gunzipSync(readFileSync(join(dir, meta.file)));
    const values = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
    const rowOf = new Int32Array(meta.grid.lat.length * meta.grid.lon.length).fill(-1);
    meta.cells.forEach((id, row) => (rowOf[id] = row));
    const months = Array.from({ length: meta.n_months }, (_, k) => {
      const m = Number(meta.month_start.slice(0, 4)) * 12 + Number(meta.month_start.slice(5)) - 1 + k;
      return `${Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, "0")}`;
    });
    const layer: GlobalLayer = { meta, months, values, rowOf };
    const { a, b } = defaultMonths(layer);
    const r = compareAt(layer, "heat", { lat: 23.7, lon: 90.4 }, a, b);
    const row = rowAt(layer, { lat: 23.7, lon: 90.4 });
    expect(row).toBeGreaterThanOrEqual(0);
    const at = (ym: string) => values[row * meta.n_months + months.indexOf(ym)] / meta.scale;
    expect(r.a.value).toBe(at(a));
    expect(r.b.value).toBe(at(b));
    expect(r.diff).toBeCloseTo(at(b) - at(a), 10);
  });
});
