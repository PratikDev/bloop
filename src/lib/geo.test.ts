import { describe, expect, test } from "bun:test";
import { parseCoordinate, parseLatLon } from "./geo";

describe("parseCoordinate", () => {
  test("reads signed decimals", () => {
    expect(parseCoordinate("23.8", "lat")).toBe(23.8);
    expect(parseCoordinate(" -23.8 ", "lat")).toBe(-23.8);
    expect(parseCoordinate("−45", "lon")).toBe(-45);
    expect(parseCoordinate(".5", "lon")).toBe(0.5);
  });

  test("reads hemisphere letters before or after, with or without a degree sign", () => {
    expect(parseCoordinate("21.5° N", "lat")).toBe(21.5);
    expect(parseCoordinate("21.5 s", "lat")).toBe(-21.5);
    expect(parseCoordinate("W 89.8", "lon")).toBe(-89.8);
    expect(parseCoordinate("89.8°E", "lon")).toBe(89.8);
  });

  test("reads Bengali digits", () => {
    expect(parseCoordinate("২৩.৮", "lat")).toBe(23.8);
  });

  test("refuses the wrong hemisphere, two letters, a letter with a minus, and out-of-range values", () => {
    expect(parseCoordinate("23.8 E", "lat")).toBeNull();
    expect(parseCoordinate("N23.8S", "lat")).toBeNull();
    expect(parseCoordinate("-23.8 S", "lat")).toBeNull();
    expect(parseCoordinate("90.1", "lat")).toBeNull();
    expect(parseCoordinate("180", "lon")).toBe(180);
    expect(parseCoordinate("181", "lon")).toBeNull();
  });

  test("refuses what isn't a number", () => {
    for (const text of ["", "abc", "1.2.3", "12a", "-", "."]) expect(parseCoordinate(text, "lat")).toBeNull();
  });
});

describe("parseLatLon", () => {
  test("reads a pasted pair, latitude first", () => {
    expect(parseLatLon("23.8, 90.4")).toEqual({ lat: 23.8, lon: 90.4 });
    expect(parseLatLon("21.5° N, 89.8° W")).toEqual({ lat: 21.5, lon: -89.8 });
  });

  test("refuses a single value or a bad half", () => {
    expect(parseLatLon("23.8")).toBeNull();
    expect(parseLatLon("95, 90")).toBeNull();
  });
});
