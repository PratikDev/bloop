// Water's journey: steps in order with 2 s of silence between datasets, each step's events through its own rule, each
// step in its Earth Orchestra family; the WAV encoder is deterministic and well-formed.

import { describe, expect, test } from "bun:test";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { classesRule, classState, LANDSLIDE_VOICE } from "@/lib/earth/classes";
import { encodeWav, fingerprint } from "../wav";
import { buildJourney, GAP_SEC, stepAt, type JourneySource } from "./plan";

const src = (id: JourneySource["id"], recordId: string, voiceId: string, values: (number | null)[], stepSec: number): JourneySource => ({
  id, recordId, voiceId, values, stepSec, dataset: "d", period: "p", status: "verified",
});

describe("Water's journey", () => {
  const j = buildJourney([
    src("lightning", "lightning_5011", "lightningClicks", [0, 2, null, 5], 0.3),
    src("river", "river_4960", "riverTransport", [0.1, 0.5, null], 0.4),
    src("rain", "rain", "rain", [0, 1, 10], 0.25),
    src("slope", "landslide_lhasa", LANDSLIDE_VOICE, [0, 1, 2, 4], 1.5),
    src("water", "water", "water", [-5, 0, 3], 0.4),
    src("sea", "ocean", "ocean", [28, 29.5, null], 0.4),
  ]);

  test("in order, 2 s of silence between datasets", () => {
    expect(j.steps.map((s) => s.id)).toEqual(["lightning", "river", "rain", "slope", "water", "sea"]);
    for (let i = 1; i < j.steps.length; i++) expect(j.steps[i].start - j.steps[i - 1].end).toBeCloseTo(GAP_SEC, 9);
    expect(stepAt(j, j.steps[0].end + 1)).toBeNull();
  });

  test("each step's notes are its own rule's values; no data is silence", () => {
    const river = j.steps[1];
    const rule = continuousRule("riverTransport");
    expect(river.events).toEqual([0.1, 0.5].map((v, i) => ({ kind: "tone", hz: mapContinuous(v, rule) as number, at: river.start + i * 0.4, dur: 0.4 * 0.92 })));
    const lightning = j.steps[0];
    expect(lightning.events.every((e) => e.kind === "tick")).toBe(true);
    expect(lightning.events.filter((e) => e.at < lightning.start + 0.6).length).toBeGreaterThan(0);
    expect(lightning.events.some((e) => e.at >= lightning.start + 0.6 && e.at < lightning.start + 0.89)).toBe(false); // null step: silent
  });

  test("Earth Orchestra families: air, air, air, land, ice, ocean", () => {
    expect(j.steps.map((s) => s.category)).toEqual(["air", "air", "air", "land", "ice", "ocean"]);
  });

  test("the landslide step: each class's own rumble from its rule; stated silences play nothing; no Sa", () => {
    const slope = j.steps[3];
    const rule = classesRule(LANDSLIDE_VOICE);
    const want = [0, 1, 2, 4].flatMap((code, i) => {
      const r = classState(rule, code)?.rumble;
      return r ? [{ kind: "rumble" as const, rumble: r, at: slope.start + i * 1.5, dur: 1.5 * 0.92 }] : [];
    });
    expect(want.length).toBe(2); // none shown and low are silences; moderate and very high rumble
    expect(slope.events).toEqual(want);
    expect(slope.sa).toBeNull();
  });

  test("WAV: header, length and the same bytes every time", () => {
    const a = Float32Array.from({ length: 100 }, (_, i) => Math.sin(i / 3));
    const w1 = encodeWav([a, a], 22050);
    expect(String.fromCharCode(...w1.slice(0, 4))).toBe("RIFF");
    expect(w1.length).toBe(44 + 100 * 2 * 2);
    expect(fingerprint(w1)).toBe(fingerprint(encodeWav([a, a], 22050)));
  });
});
