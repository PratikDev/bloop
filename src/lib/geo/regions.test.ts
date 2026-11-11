// The region tree from the shipped geo files, and the division table it relies on.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BD_DIVISIONS } from "./bd-divisions";
import type { GeoFiles } from "./gazetteer";
import { regionTree } from "./regions";

const geo = <T,>(name: string) => JSON.parse(readFileSync(join(import.meta.dir, "../../../public/geo", name), "utf8")) as T;
const files = {
  countries110m: geo<GeoFiles["countries110m"]>("countries-110m.json"),
  districts: geo<GeoFiles["districts"]>("bd-districts.json"),
} as GeoFiles;

describe("Bangladesh's divisions", () => {
  test("every district in the geo file is in exactly one division, and every division's district is in the file", () => {
    const shipped = files.districts.features.map((f) => f.properties.shapeName).sort();
    const listed = BD_DIVISIONS.flatMap((d) => d.districts).sort();
    expect(listed).toEqual(shipped);
    expect(new Set(listed).size).toBe(64);
    expect(BD_DIVISIONS.length).toBe(8);
  });
});

describe("the region tree", () => {
  const tree = regionTree(files);

  test("continents, then countries A to Z; every country with a continent is listed once", () => {
    expect(tree[0].name).toBe("Asia");
    const countries = tree.flatMap((c) => c.children);
    expect(countries.length).toBe(files.countries110m.features.length);
    for (const c of tree) expect(c.children.map((x) => x.name)).toEqual([...c.children.map((x) => x.name)].sort((a, b) => a.localeCompare(b, "en")));
  });

  test("Bangladesh holds its eight divisions, each placed inside Bangladesh, with Bangla names", () => {
    const bd = tree.find((c) => c.name === "Asia")!.children.find((c) => c.id === "country:BGD")!;
    expect(bd.nameBn).toBe("বাংলাদেশ");
    expect(bd.children.map((d) => d.name)).toEqual(["Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"]);
    for (const d of bd.children) {
      expect(d.lat).toBeGreaterThan(20.5);
      expect(d.lat).toBeLessThan(26.7);
      expect(d.lon).toBeGreaterThan(88);
      expect(d.lon).toBeLessThan(92.7);
      expect(d.nameBn).toBeTruthy();
    }
    // Chattogram division lies south-east of Rangpur division.
    const [ctg, rng] = ["Chattogram", "Rangpur"].map((n) => bd.children.find((d) => d.name === n)!);
    expect(ctg.lat).toBeLessThan(rng.lat);
    expect(ctg.lon).toBeGreaterThan(rng.lon);
  });
});
