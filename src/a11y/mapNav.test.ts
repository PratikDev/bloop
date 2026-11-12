// Accessibility core, step 2: the map widget's navigation (cell size, 3×3 regions, the back trail, frame steps) and its
// state in the reducer.
import { describe, expect, test } from "bun:test";
import { initialState, reducer } from "@/components/AppState/reducer";
import { CELL_SIZES, centreOf, DEFAULT_CELL, frameAfter, nextCellSize, regionOf, remember, TRAIL_MAX, WHOLE_MAP } from "./mapNav";

describe("cell size (+ / −)", () => {
  test("walks the list one size at a time and stays at the ends", () => {
    expect(nextCellSize(DEFAULT_CELL, 1)).toBe(2);
    expect(nextCellSize(DEFAULT_CELL, -1)).toBe(0.5);
    expect(nextCellSize(CELL_SIZES[CELL_SIZES.length - 1], 1)).toBe(CELL_SIZES[CELL_SIZES.length - 1]);
    expect(nextCellSize(CELL_SIZES[0], -1)).toBe(CELL_SIZES[0]);
  });

  test("an unknown size starts again from the default", () => {
    expect(nextCellSize(3, 1)).toBe(2);
  });
});

describe("3×3 regions (J, then 1–9)", () => {
  test("numpad layout: 7 is the north-west corner, 5 the centre, 3 the south-east", () => {
    expect(regionOf(WHOLE_MAP, "7")).toEqual({ name: "northWest", bounds: { south: 30, north: 90, west: -180, east: -60 } });
    expect(regionOf(WHOLE_MAP, "5")?.bounds).toEqual({ south: -30, north: 30, west: -60, east: 60 });
    expect(regionOf(WHOLE_MAP, "3")).toEqual({ name: "southEast", bounds: { south: -90, north: -30, west: 60, east: 180 } });
  });

  test("only 1–9 pick a region", () => {
    for (const key of ["0", "j", "Enter", "10", ""]) expect(regionOf(WHOLE_MAP, key)).toBeNull();
  });

  test("the nine regions tile the view exactly", () => {
    let area = 0;
    for (let n = 1; n <= 9; n++) {
      const b = regionOf(WHOLE_MAP, String(n))!.bounds;
      area += (b.north - b.south) * (b.east - b.west);
    }
    expect(area).toBe(180 * 360);
  });

  test("a further number narrows inside the last region: 6 then 7 is around India", () => {
    const east = regionOf(WHOLE_MAP, "6")!.bounds;
    const india = regionOf(east, "7")!.bounds;
    expect(india).toEqual({ south: 10, north: 30, west: 60, east: 100 });
    expect(centreOf(india)).toEqual({ lat: 20, lon: 80 });
  });
});

describe("the back trail (.)", () => {
  test("adds a new place, skips a repeat, keeps the newest TRAIL_MAX", () => {
    const a = { lat: 1, lon: 2 };
    expect(remember([], a)).toEqual([a]);
    expect(remember([a], { ...a })).toEqual([a]);
    let trail: { lat: number; lon: number }[] = [];
    for (let i = 0; i < TRAIL_MAX + 5; i++) trail = remember(trail, { lat: i, lon: 0 });
    expect(trail.length).toBe(TRAIL_MAX);
    expect(trail[0].lat).toBe(5);
  });

  test("arrow steps and remembered jumps go on the trail; a drag's steps don't; cursorBack walks it back", () => {
    let s = reducer(initialState, { type: "moveCursor", dLat: 1, dLon: 0 });
    const stepped = s.cursor;
    s = reducer(s, { type: "setCursor", cursor: { lat: 22.36, lon: 91.78 }, remember: true });
    s = reducer(s, { type: "setCursor", cursor: { lat: 0, lon: 0 } }); // a drag step
    expect(s.trail).toEqual([initialState.cursor, stepped]);
    s = reducer(s, { type: "cursorBack" });
    expect(s.cursor).toEqual(stepped);
    s = reducer(s, { type: "cursorBack" });
    expect(s.cursor).toEqual(initialState.cursor);
    expect(reducer(s, { type: "cursorBack" })).toBe(s); // nothing left: unchanged
  });
});

describe("time step (PageUp / PageDown)", () => {
  test("from the live frame, PageDown holds the newest; PageUp past the newest goes back to live", () => {
    expect(frameAfter(null, -1, 48)).toBe(47);
    expect(frameAfter(47, 1, 48)).toBeNull();
    expect(frameAfter(10, 1, 48)).toBe(11);
    expect(frameAfter(10, -1, 48)).toBe(9);
  });

  test("the edges say so instead of moving", () => {
    expect(frameAfter(null, 1, 48)).toBe("edge");
    expect(frameAfter(0, -1, 48)).toBe("edge");
    expect(frameAfter(null, -1, 0)).toBe("edge");
  });

  test("a held frame is let go when the page changes", () => {
    const held = reducer({ ...initialState, mode: "explore" }, { type: "holdFrame", index: 5 });
    expect(reducer(held, { type: "setMode", mode: "explore" }).heldFrame).toBe(5);
    expect(reducer(held, { type: "setMode", mode: "turntable" }).heldFrame).toBeNull();
  });
});
