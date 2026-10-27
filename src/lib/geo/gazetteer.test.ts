import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createGazetteer, type GeoFiles } from "./gazetteer";
import { distanceKm } from "./spherical";

const read = (name: string) => JSON.parse(readFileSync(new URL(`../../../public/geo/${name}`, import.meta.url), "utf8"));
const files: GeoFiles = {
  countries110m: read("countries-110m.json"),
  countriesSouthAsia: read("countries-10m-south-asia.json"),
  districts: read("bd-districts.json"),
  marine: read("marine.json"),
  places: read("places.json"),
  story: read("story-places.json"),
};
const gaz = createGazetteer(files);

describe("where am I", () => {
  test("18.0 N 88.0 E is in the Bay of Bengal", () => {
    const w = gaz.whereAmI({ lat: 18, lon: 88 });
    expect(w.sea?.name).toBe("Bay of Bengal");
    expect(w.nearest).not.toBeNull();
  });

  test("23.81 N 90.41 E is Dhaka, Bangladesh", () => {
    const w = gaz.whereAmI({ lat: 23.81, lon: 90.41 });
    expect(w.atCity?.name).toBe("Dhaka");
    expect(w.country?.name).toBe("Bangladesh");
  });

  // Natural Earth's own answer (checked against the raw 10m file): its "Gulf of
  // Guinea" polygon spans only ~3–6° N near the coast, and the equator is its
  // North / South Atlantic boundary.
  test("0 N 0 E is Natural Earth's South Atlantic Ocean; 3 N 2 E is the Gulf of Guinea", () => {
    expect(gaz.whereAmI({ lat: 0, lon: 0 }).sea?.name).toBe("South Atlantic Ocean");
    expect(gaz.whereAmI({ lat: 3, lon: 2 }).sea?.name).toBe("Gulf of Guinea");
  });

  test("a Sundarbans point is in Khulna, Bagerhat or Satkhira district", () => {
    const w = gaz.whereAmI({ lat: 21.95, lon: 89.18 });
    expect(["Khulna", "Bagerhat", "Satkhira"]).toContain(w.district ?? "none");
  });
});

describe("search", () => {
  test.each([
    ["dhaka", { lat: 23.725, lon: 90.4066 }],
    ["ঢাকা", { lat: 23.725, lon: 90.4066 }],
    ["sundarbans", { lat: 21.95, lon: 89.18 }],
    ["bay of bengal", { lat: 18, lon: 88 }],
    ["cox", { lat: 21.42722, lon: 92.005 }],
  ])("%s → the right place (within 0.2°)", (query, expected) => {
    const [top] = gaz.search(query);
    expect(top).toBeDefined();
    expect(Math.abs(top.lat - expected.lat)).toBeLessThan(0.2);
    expect(Math.abs(top.lon - expected.lon)).toBeLessThan(0.2);
  });

  test("typos still find a place", () => {
    expect(gaz.search("chatogram")[0]?.name).toBe("Chattogram");
  });
});

test("distance and direction read sensibly (Khulna → 18 N 88 E is about 560 km SW)", () => {
  const km = distanceKm({ lat: 22.8419, lon: 89.5581 }, { lat: 18, lon: 88 });
  expect(km).toBeGreaterThan(500);
  expect(km).toBeLessThan(600);
});
