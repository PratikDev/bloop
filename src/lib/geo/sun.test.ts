import { describe, expect, test } from "bun:test";
import { Body, Equator, Observer, SiderealTime } from "astronomy-engine";
import { subsolarPoint } from "./sun";

/** Reference subsolar point from astronomy-engine (apparent RA/dec of date, Greenwich apparent sidereal time). */
function reference(date: Date) {
  const eq = Equator(Body.Sun, date, new Observer(0, 0, 0), true, true);
  const lon = ((((eq.ra - SiderealTime(date)) * 15 + 180) % 360) + 360) % 360 - 180;
  return { lat: eq.dec, lon };
}

const lonDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

describe("subsolarPoint", () => {
  test.each([
    ["SST frame time", "2026-09-25T00:00:00Z"],
    ["rain frame time", "2026-09-28T08:30:00Z"],
    ["June solstice", "2026-06-21T12:00:00Z"],
  ])("%s (%s) is within 1° of astronomy-engine", (_name, iso) => {
    const date = new Date(iso);
    const ours = subsolarPoint(date);
    const ref = reference(date);
    expect(Math.abs(ours.lat - ref.lat)).toBeLessThan(1);
    expect(lonDiff(ours.lon, ref.lon)).toBeLessThan(1);
  });
});
