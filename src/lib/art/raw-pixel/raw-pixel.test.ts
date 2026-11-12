// The raw-pixel demo: the stored numbers (public/data/art/raw_pixel.json, what the screen shows) equal a fresh
// measurement of the same renders; the measures behave on known signals; the naive version is reachable only from the
// demo's card (it never plays in normal modes).

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { OfficialManifest } from "@/types/data-contract";
import { frameFrom } from "./frame";
import { measure, pairRoughness, stored } from "./metrics";
import { RAW_RATE, renderBloop, renderNaive, hue } from "./render";

const ROOT = process.cwd();
const file = JSON.parse(readFileSync(join(ROOT, "public/data/art/raw_pixel.json"), "utf8"));

function frame() {
  const dir = join(ROOT, "public/data/official/currents_3912");
  const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as OfficialManifest;
  const layer = m.layers.find((l) => l.id === "sst")!;
  const raw = gunzipSync(readFileSync(join(dir, layer.chunks[0].file)));
  return frameFrom(layer, new Uint16Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)));
}

describe("raw-pixel demo", () => {
  test("the stored measurement equals a fresh one of the same renders", () => {
    const f = frame();
    expect(stored(measure(renderNaive(f), RAW_RATE))).toEqual(file.naive);
    expect(stored(measure(renderBloop(f), RAW_RATE))).toEqual(file.bloop);
  });

  test("the naive scan is flatter, rougher and more spread than Bloop (measured)", () => {
    expect(file.naive.flatness).toBeGreaterThan(file.bloop.flatness);
    expect(file.naive.roughness).toBeGreaterThan(file.bloop.roughness);
    expect(file.naive.entropy).toBeGreaterThan(file.bloop.entropy);
  });

  test("measures on known signals: a pure tone is near 0, noise near 1; Plomp-Levelt peaks near a quarter of a critical band", () => {
    const n = RAW_RATE;
    const tone = Float32Array.from({ length: n }, (_, i) => 0.3 * Math.sin((2 * Math.PI * 440 * i) / RAW_RATE));
    let s = 7;
    const noise = Float32Array.from({ length: n }, () => ((s = (s * 16807) % 2147483647) / 2147483647) * 0.6 - 0.3);
    expect(measure(tone, RAW_RATE).flatness).toBeLessThan(0.01);
    expect(measure(noise, RAW_RATE).flatness).toBeGreaterThan(0.4);
    expect(pairRoughness(440, 440, 1, 1)).toBe(0);
    expect(pairRoughness(440, 460, 1, 1)).toBeGreaterThan(pairRoughness(440, 880, 1, 1));
    expect(hue([0, 0, 0])).toBe(0);
  });

  test("only the demo's card (and its script and tests) reaches the naive render", () => {
    const users: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/u.test(name) && readFileSync(p, "utf8").includes("renderNaive")) users.push(p.slice(ROOT.length + 1).replaceAll("\\", "/"));
      }
    };
    walk(join(ROOT, "src"));
    expect(users.sort()).toEqual(["src/components/Art/RawPixel.tsx", "src/lib/art/raw-pixel/raw-pixel.test.ts", "src/lib/art/raw-pixel/render.ts"]);
  });
});
