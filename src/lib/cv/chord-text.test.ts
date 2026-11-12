// B4: the chord's words. Two groups with their shares, one group, "brief" gives the count, relative drops units, a
// blocked chord says why; the braille line is braille-safe and fits one 40-cell line.
import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import type { ChordGate, ChordTone } from "@/lib/audio/layers/types";
import { bindT } from "@/lib/i18n";
import { chordShort, chordText } from "./chord-text";

const t = bindT("en");
const ok: ChordGate = { allowed: true, block: null, modesOnly: false, trust: "verified" };
const two: ChordTone[] = [
  { value: 18.9, hz: 1, fraction: 0.4, gain: 0.04 },
  { value: 20.4, hz: 2, fraction: 0.6, gain: 0.06 },
];

describe("chord text", () => {
  test("two groups, one group, brief", () => {
    expect(chordText(t, "en", ok, two, "°C", false)).toBe("Two groups: 18.9 °C (40 %) and 20.4 °C (60 %)");
    expect(chordText(t, "en", ok, [{ ...two[0], value: 28.4, fraction: 1 }], "°C", false)).toBe("One group around 28.4 °C");
    expect(chordText(t, "en", ok, two, "°C", true)).toBe("Chord: 2 groups");
  });

  test("relative: no units; blocked: the reason", () => {
    expect(chordText(t, "en", { ...ok, trust: "relative" }, two, "°C", false)).toBe("Two groups: 18.9 (40 %) and 20.4 (60 %) (relative values)");
    expect(chordText(t, "en", { ...ok, allowed: false, block: "pattern-only" }, [], "°C", false)).toContain("pattern only");
  });

  test("Bangla digits on screen", () => {
    expect(chordText(bindT("bn"), "bn", ok, two, "°C", false)).toContain("১৮.৯");
  });

  test("braille line", () => {
    const s = chordShort(ok, two, "°C");
    expect(s).toBe("Chord 2 grp 18.9C 40% 20.4C 60%");
    expect(violations(s, 40)).toEqual([]);
    expect(chordShort({ ...ok, allowed: false, block: "both" }, two, "°C")).toBe("");
  });
});
