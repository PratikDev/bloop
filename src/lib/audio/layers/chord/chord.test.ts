// T1, the chord's contract: tones sit at the record's own value → pitch within 1 cent; gains
// follow the groups' shares; at most 2 voices; the honesty gate for every status and mode; either owner keeps it on;
// stop releases both; hysteresis holds the chord while groups move less than σ.
import { describe, expect, test } from "bun:test";
import { mapVoice } from "../../mapping-maths";
import type { ValueTrust } from "../types";
import { createValueChord, type ChordView } from ".";
import { chordPeak } from "./voice";

const cluster = (at: number, width: number, n: number) => Array.from({ length: n }, (_, i) => at - width + (2 * width * (i + 0.5)) / n);
const asc = (...xs: number[][]) => xs.flat().sort((a, b) => a - b);
const view = (values: number[], trust: ValueTrust = "verified", recordId = "ocean"): ChordView => ({ recordId, trust, pitchVoice: "ocean", sigma: 0.31, values });
const BIMODAL = asc(cluster(18.9, 0.3, 400), cluster(20.4, 0.3, 600));
const single = { recordId: "ocean", playMode: "single" } as const;
const cents = (a: number, b: number) => 1200 * Math.abs(Math.log2(a / b));

describe("value chord", () => {
  test("tones at the melody's own pitch for each group's value (≤ 1 cent), gains ∝ shares", () => {
    const c = createValueChord();
    c.setView(view(BIMODAL));
    expect(c.enable(single, "user").allowed).toBe(true);
    const tones = c.sounding();
    expect(tones.length).toBe(2);
    for (const t of tones) expect(cents(t.hz, mapVoice("ocean", t.value) ?? NaN)).toBeLessThanOrEqual(1);
    expect(tones[0].gain / tones[1].gain).toBeCloseTo(tones[0].fraction / tones[1].fraction, 6);
    expect(tones.reduce((s, t) => s + t.gain, 0)).toBeCloseTo(chordPeak(), 9);
  });

  test("at most 2 voices", () => {
    const c = createValueChord();
    c.setView(view(asc(cluster(10, 0.2, 300), cluster(15, 0.2, 300), cluster(20, 0.2, 300))));
    c.enable(single, "user");
    expect(c.sounding().length).toBe(2);
  });

  test("the honesty gate, status by status and mode by mode", () => {
    const c = createValueChord();
    for (const [trust, block] of [["verified", null], ["stated", null], ["relative", null], ["pattern", "pattern-only"]] as const) {
      c.setView(view(BIMODAL, trust));
      const g = c.enable(single, "user");
      expect([trust, g.block, g.trust]).toEqual([trust, block, trust]);
      expect(c.sounding().length).toBe(block ? 0 : 2);
    }
    c.setView(view(BIMODAL));
    expect(c.gate({ recordId: "ocean", playMode: "both" }).block).toBe("both");
    expect(c.gate({ recordId: "ocean", playMode: "duet" }).block).toBe("duet");
    c.setView(view([]));
    expect(c.gate(single).block).toBe("no-data");
    c.setView(view(BIMODAL, "verified", "eic_5147")); // a rainbow bar: not on the generated allowlist
    expect(c.gate({ recordId: "eic_5147", playMode: "single" }).block).toBe("not-allowlisted");
    c.setView({ ...view(BIMODAL), sigma: null });
    expect(c.gate(single).block).toBe("not-allowlisted");
  });

  test("either owner keeps it on; stop releases both", () => {
    const c = createValueChord();
    c.setView(view(BIMODAL));
    expect(c.gate(single).block).toBe("off");
    c.enable(single, "user");
    c.enable(single, "dial");
    c.disable("user");
    expect(c.sounding().length).toBe(2);
    c.disable("dial");
    expect(c.sounding().length).toBe(0);
    c.enable(single, "user");
    c.enable(single, "dial");
    c.stop();
    expect(c.sounding().length).toBe(0);
    expect(c.gate(single).block).toBe("off");
  });

  test("hysteresis: groups moving less than σ keep the chord; more than σ change it", () => {
    const c = createValueChord();
    c.setView(view(BIMODAL));
    c.enable(single, "user");
    const before = c.sounding();
    c.setView(view(BIMODAL.map((v) => v + 0.1)));
    expect(c.sounding()).toBe(before);
    c.setView(view(BIMODAL.map((v) => v + 0.5)));
    expect(c.sounding()).not.toBe(before);
  });
});
