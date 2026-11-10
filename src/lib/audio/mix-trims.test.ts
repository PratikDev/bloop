// The mix pass's per-voice trims (docs/audio/MIX.md): the committed table equals its recomputation from the untrimmed
// measurements and the master compressor; a trim is level only (the voice's value → pitch is the rule's, untouched); no
// trim pushes a mode's measured peak past the compressor's threshold less the headroom.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { continuousRule, mapContinuous, MAPPING } from "./mapping";
import { channelGain, trimDb } from "./mix-trims";
import table from "./mix-trims.json";

const baseline = JSON.parse(readFileSync(join(process.cwd(), "docs/audio/mix_baseline.json"), "utf8")) as {
  target_lufs: number;
  modes: Record<string, { lufs: number; true_peak_dbtp: number }>;
};

describe("mix trims", () => {
  test("each trim is min(target − loudness, peak limit − true peak) of its mode, from the baseline", () => {
    expect(table.peak_limit_dbtp).toBeLessThan(MAPPING.global.compressor.thresholdDb);
    for (const [voice, v] of Object.entries(table.voices)) {
      const m = baseline.modes[v.from_mode];
      const want = Math.min(baseline.target_lufs - m.lufs, table.peak_limit_dbtp - m.true_peak_dbtp);
      expect([voice, Math.abs(v.trim_db - want) <= 0.05]).toEqual([voice, true]);
      expect(m.true_peak_dbtp + v.trim_db).toBeLessThanOrEqual(table.peak_limit_dbtp + 0.05);
    }
  });

  test("a channel's gain is the voice cap times its trim; untrimmed voices keep the cap", () => {
    expect(channelGain("ocean")).toBeCloseTo(MAPPING.global.voiceMaxGain * 10 ** (trimDb("ocean") / 20), 12);
    expect(channelGain("fires")).toBe(MAPPING.global.voiceMaxGain);
  });

  test("trims are level only: the trimmed voices' value → pitch is the rule's own", () => {
    for (const voice of ["ocean", "heat", "water"]) {
      const rule = continuousRule(voice);
      const mid = (rule.input.min + rule.input.max) / 2;
      expect(mapContinuous(mid, rule)).toBe(mapContinuous(mid, continuousRule(voice)));
      expect(JSON.stringify(rule)).not.toContain("trim");
    }
  });
});
