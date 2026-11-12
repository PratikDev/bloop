// "Your lifetime" and its MIDI: one note per year, pitches from the rule, wording that follows the file's test result,
// a link that reproduces the same song, and MIDI that reads back within 1 cent of the rule.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lifetimeLink } from "@/components/Art/Lifetime";
import { mapVoice } from "@/lib/audio/mapping";
import { monsoonDrops } from "@/lib/audio/context-maths";
import { bindT } from "@/lib/i18n";
import { thenNowSearch } from "@/router/search";
import { centsBetween } from "../meend";
import { midiFile, readMidi, toMidi } from "../midi";
import { songMidi } from "./export";
import { bornRange, lifetimeSong, NOTE_SEC, songTimes, type LifetimeFile } from "./song";
import { lifetimeLines, verdictOf } from "./words";

const file = JSON.parse(readFileSync(join(process.cwd(), "public/data/thenvsnow/lifetime.json"), "utf8")) as LifetimeFile;
const t = bindT("en");

describe("the song of your lifetime", () => {
  test("one note per year, at four notes a second", () => {
    for (const born of [1951, 1979, 1998, 2010, 2020]) {
      for (const p of lifetimeSong(file, "Dhaka", born)) {
        const s = p.series;
        expect(p.notes.length).toBe(s.years.filter((y) => y >= born).length);
        expect(p.notes.map((n) => n.at)).toEqual(p.notes.map((_, i) => i * NOTE_SEC));
      }
    }
  });

  test("pitches are the rule's (heat, water) and rain is the monsoon rule's drops", () => {
    const [heat, rain, water] = lifetimeSong(file, "Sylhet", 1990);
    for (const n of heat.notes) expect(n.hz).toBe(mapVoice("heat", n.value));
    for (const n of water.notes) expect(n.hz).toBe(mapVoice("water", n.value));
    for (const n of rain.notes) expect([n.hz, n.drops]).toEqual([null, monsoonDrops(n.value)]);
  });

  test("the wording follows the test: clear, no clear trend, or too few years (range only)", () => {
    const [lo, hi] = bornRange(file, "Dhaka");
    for (let born = lo; born <= hi; born++) {
      const parts = lifetimeSong(file, "Dhaka", born);
      const lines = lifetimeLines(t, "en", "Dhaka", born, parts);
      expect(lines[0]).toBe(`Since ${born} in Dhaka:`);
      parts.forEach((p, i) => {
        const v = verdictOf(p);
        const line = lines[i + 1];
        if (v === "clear") expect(line).toMatch(/(rose|fell) .*: a clear trend\.$/u);
        if (v === "unclear") expect(line).toContain("no clear trend");
        if (v === "tooFew") expect(line).toContain("too few years for a clear test");
        if (v !== "clear") expect(line).not.toMatch(/rose|fell/u);
        if (p.notes.length < file.method.min_years) expect(v).toBe("tooFew");
      });
    }
  });

  test("the link holds only the year and city, and reproduces the same song", () => {
    const link = lifetimeLink(1998, "Dhaka");
    expect(link).toBe("/then-now?born=1998&city=dhaka");
    const q = Object.fromEntries(new URL(link, "https://x").searchParams);
    const s = thenNowSearch(q);
    expect([s.view, s.born, s.city]).toEqual(["lifetime", 1998, "Dhaka"]);
    expect(lifetimeSong(file, s.city!, s.born!)).toEqual(lifetimeSong(file, "Dhaka", 1998));
  });
});

describe("MIDI for a performer", () => {
  test("re-reading the MIDI gives frequencies within 1 cent of the rule", () => {
    const parts = lifetimeSong(file, "Dhaka", 1960);
    const back = readMidi(songMidi(parts));
    const pitched = songTimes(parts, 0).filter((_, k) => parts.flatMap((p) => p.notes)[k].hz !== null);
    const hz = parts.flatMap((p) => p.notes).filter((n) => n.hz !== null).map((n) => n.hz as number);
    expect(back.length).toBe(hz.length);
    back.forEach((b, i) => {
      expect(Math.abs(centsBetween(b.hz, hz[i]))).toBeLessThan(1);
      expect(Math.abs(b.start - pitched[i].time)).toBeLessThan(0.002);
    });
  });
  test("note + bend: any frequency in range, within 1 cent", () => {
    for (let hz = 60; hz < 1200; hz *= 1.0137) {
      const back = readMidi(midiFile([{ hz, start: 0, duration: 0.2 }]))[0].hz;
      expect(Math.abs(centsBetween(back, hz))).toBeLessThan(1);
      expect(Math.abs(toMidi(hz).cents)).toBeLessThanOrEqual(50);
    }
  });
});

describe("Then vs Now MIDI", () => {
  test("heat and water parts read back within 1 cent of their rules", async () => {
    const { buildThenNowInput } = await import("@/lib/then-now");
    const { partMidi } = await import("../then-now-midi");
    const demo = JSON.parse(readFileSync(join(process.cwd(), "public/data/demo/dhaka_then_now.json"), "utf8"));
    const grace = JSON.parse(readFileSync(join(process.cwd(), "public/data/context/grace.json"), "utf8"));
    const input = buildThenNowInput(demo, grace);
    const heat = [...input.heat.A.values, ...input.heat.B.values].map((v) => mapVoice("heat", v) as number);
    const back = readMidi(partMidi(input, "heat"));
    expect(back.length).toBe(heat.length);
    back.forEach((b, i) => expect(Math.abs(centsBetween(b.hz, heat[i]))).toBeLessThan(1));
    const water = input.water.cm.filter((v): v is number => v !== null).map((v) => mapVoice("water", v) as number);
    const wback = readMidi(partMidi(input, "water"));
    expect(wback.length).toBe(water.length);
    wback.forEach((b, i) => expect(Math.abs(centsBetween(b.hz, water[i]))).toBeLessThan(1));
  });
});
