// ART's listener-test tasks: the answers come from the data, the orders are counterbalanced, the whole test stays
// within 10 minutes with room for CV's two chord tasks, and the summary reads the new fields.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXTRA_MODULES } from "@/components/pages/ListenTest/extras/registry";
import { readData } from "@/lib/i18n/data-sentences";
import type { SstPairsFile } from "@/types/data-contract";
import { isResultsFile, resultsFile, TEST_VERSION } from "../results";
import { earEyeItems, peakThird } from "./ear-eye";
import { emotionClip, emotionOrder } from "./emotion";
import { extrasReport } from "./summary";
import { counterbalance, LIMIT_SECONDS, planSeconds } from "./types";
import { TASK_IDS } from "../tasks";

describe("emotion ratings", () => {
  test("both orders occur; the clip is the checked points' own frame values, west to east", () => {
    expect(emotionOrder(0.1)).toEqual(["sound", "visual"]);
    expect(emotionOrder(0.9)).toEqual(["visual", "sound"]);
    const pairs = readData<SstPairsFile>("truth/sst_pairs.json").pairs;
    const clip = emotionClip(pairs);
    const sorted = [...pairs].sort((a, b) => a.lon - b.lon).slice(0, 20);
    expect(clip.values).toEqual(sorted.map((p) => p.frame));
  });
});

describe("ear vs eye", () => {
  test("the peak's third comes from the data; no rain means no question", () => {
    expect(peakThird([0, 5, 1, 0, 0, 0])).toBe("early");
    expect(peakThird([0, 0, 1, 5, 0, 0])).toBe("middle");
    expect(peakThird([0, 0, 0, 0, 1, 5])).toBe("late");
    expect(peakThird([0, 0, null])).toBeNull();
  });
  test("one half heard, the other seen, in both orders", () => {
    const pts = Array.from({ length: 48 }, (_, i) => ({ lat: 20, lon: 90, mmPerHour: i === 5 || i === 45 ? 9 : 1 }));
    for (const [a, b] of [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]]) {
      const items = earEyeItems(pts, a, b)!;
      expect(items.map((x) => x.sense).sort()).toEqual(["picture", "sound"]);
      expect(items.map((x) => x.half).sort()).toEqual([0, 1]);
      expect(items.find((x) => x.half === 0)?.correct).toBe("early");
      expect(items.find((x) => x.half === 1)?.correct).toBe("late");
    }
    expect(counterbalance("a", "b", 0.7)).toEqual(["b", "a"]);
  });
});

describe("the test as a whole", () => {
  test("ten minutes at most with every task: the five core, CV's two chord tasks, and the extras", () => {
    expect(TASK_IDS).toContain("chordVariety");
    expect(planSeconds(TASK_IDS.length, EXTRA_MODULES.map((m) => m.info))).toBeLessThanOrEqual(LIMIT_SECONDS);
  });
  test("testVersion separates sessions: 1 for the five core tasks only, TEST_VERSION when any new task ran", () => {
    expect(TEST_VERSION).toBe(3);
    expect(resultsFile("en", [], "").testVersion).toBe(1);
    expect(resultsFile("en", [], "", { emotion: [{ condition: "sound", position: 1, valence: 3, connection: 4 }] }).testVersion).toBe(TEST_VERSION);
    const chord = { task: "chordGroups" as const, answer: "one" as const, correct_answer: "one" as const, correct: true, ms: 1 };
    expect(resultsFile("en", [chord], "").testVersion).toBe(TEST_VERSION);
  });
  test("the summary reads the extras (means per condition, correct per sense)", () => {
    const f = JSON.parse(readFileSync(join(process.cwd(), "src/lib/listen-test/extras/fixtures/P04.json"), "utf8"));
    expect(isResultsFile(f)).toBe(true);
    const out = extrasReport([f]).join("\n");
    expect(out).toContain("testVersion 2+): 1");
    expect(out).toMatch(/sound\s+1\s+4\.00\s+4\.00/u);
    expect(out).toMatch(/visual\s+1\s+3\.00\s+2\.00/u);
    expect(out).toMatch(/picture\s+1\s+0/u);
  });
});
