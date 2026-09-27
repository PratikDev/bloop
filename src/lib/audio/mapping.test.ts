import { describe, expect, test } from "bun:test";
import raw from "../../../public/mapping.json";
import type { BandsMapping, ContinuousMapping, RuntimeRangeMapping } from "@/types/data-contract";
import {
  MAPPING,
  MappingError,
  bandFor,
  loudnessGain,
  mapContinuous,
  mapRuntime,
  mapVoice,
  normalise,
  panFor,
  ruleParts,
  ruleText,
  runtimeRange,
  validateMapping,
  voiceSpec,
} from "./mapping";

const continuous = (id: string) => voiceSpec(id).mapping as ContinuousMapping;
const bands = (id: string) => voiceSpec(id).mapping as BandsMapping;
const runtime = (id: string) => voiceSpec(id).mapping as RuntimeRangeMapping;
const copy = () => JSON.parse(JSON.stringify(raw));

describe("validateMapping", () => {
  test("accepts the real mapping.json with all 13 entries", () => {
    const spec = validateMapping(copy());
    expect(spec.voices.map((v) => v.id)).toEqual([
      "ocean", "rain", "snow", "heat", "heatDeviation", "monsoon", "water",
      "fires", "vegetation", "nodata", "whisper", "ping", "motif",
    ]);
  });

  test("rejects min >= max", () => {
    const bad = copy();
    bad.voices[0].mapping.input.min = 35;
    expect(() => validateMapping(bad)).toThrow(MappingError);
    expect(() => validateMapping(bad)).toThrow(/min \(35\) must be less than max/);
  });

  test("rejects a log input with min 0", () => {
    const bad = copy();
    bad.voices[1].mapping.input.min = 0;
    expect(() => validateMapping(bad)).toThrow(/log scale needs min > 0/);
  });

  test("rejects bands out of order", () => {
    const bad = copy();
    const b = bad.voices.find((v: { id: string }) => v.id === "heatDeviation").mapping.bands;
    b[1].upTo = 0.2;
    expect(() => validateMapping(bad)).toThrow(/ascending order/);
  });

  test("rejects a voice louder than the voice budget", () => {
    const bad = copy();
    bad.voices[0].sound.maxGain = 0.5;
    expect(() => validateMapping(bad)).toThrow(/maxGain \(0.5\) must be in \(0, 0.25\]/);
  });

  test("rejects an earcon louder than the earcon budget", () => {
    const bad = copy();
    bad.voices.find((v: { id: string }) => v.id === "ping").sound.maxGain = 0.2;
    expect(() => validateMapping(bad)).toThrow(/for group "earcon"/);
  });

  test("rejects duplicate ids and legend points outside the input range", () => {
    const dup = copy();
    dup.voices[1].id = "ocean";
    expect(() => validateMapping(dup)).toThrow(/listed twice/);
    const legend = copy();
    legend.voices[0].legend.push({ value: 40, label: "40 °C" });
    expect(() => validateMapping(legend)).toThrow(/outside the input range/);
  });

  test("the gain budget holds: 3 voices + earcons stay below 1.0, and with narration ducked too", () => {
    const g = MAPPING.global;
    const voices = g.maxConcurrentVoices * g.voiceMaxGain;
    expect(voices + g.earconMaxGain).toBeLessThan(1);
    expect(voices * g.duck.level + g.earconMaxGain + g.narrationMaxGain).toBeLessThan(1);
    // heat + its deviation voice share one voice budget
    expect(voiceSpec("heat").sound.maxGain + voiceSpec("heatDeviation").sound.maxGain).toBeLessThanOrEqual(
      g.voiceMaxGain,
    );
  });
});

describe("ocean: °C → Hz", () => {
  test("endpoints and midpoint", () => {
    expect(mapVoice("ocean", -5)).toBeCloseTo(220, 6);
    expect(mapVoice("ocean", 35)).toBeCloseTo(880, 6);
    expect(mapVoice("ocean", 15)).toBeCloseTo(440, 6); // t = 0.5 → 220 × 2
  });

  test("clamps outside the range; null stays null", () => {
    expect(mapVoice("ocean", 50)).toBeCloseTo(880, 6);
    expect(mapVoice("ocean", -20)).toBeCloseTo(220, 6);
    expect(mapVoice("ocean", null)).toBeNull();
    expect(mapVoice("ocean", Number.NaN)).toBeNull();
  });

  test("1 °C step ≈ 3.5 % frequency change (AUDIO_RESEARCH B2)", () => {
    const ratio = mapVoice("ocean", 21)! / mapVoice("ocean", 20)!;
    expect(ratio).toBeCloseTo(1.0353, 4);
  });
});

describe("rain: mm/h (log) → drops/s", () => {
  test("endpoints and log midpoint", () => {
    expect(mapVoice("rain", 0.1)).toBeCloseTo(2, 6);
    expect(mapVoice("rain", 50)).toBeCloseTo(40, 6);
    expect(mapVoice("rain", Math.sqrt(0.1 * 50))).toBeCloseTo(21, 6); // t = 0.5
  });

  test("dry (0) has no position on the log scale", () => {
    expect(mapVoice("rain", 0)).toBeNull();
    expect(normalise(0, continuous("rain").input)).toBeNull();
  });

  test("snow uses the same density rule", () => {
    for (const v of [0.1, 1, 5, 50]) expect(mapVoice("snow", v)).toBeCloseTo(mapVoice("rain", v)!, 9);
  });
});

describe("heat then vs now: anomaly °C → Hz", () => {
  test("endpoints", () => {
    expect(mapVoice("heat", -2)).toBeCloseTo(220, 6);
    expect(mapVoice("heat", 3)).toBeCloseTo(880, 6);
  });

  test("demo window means −0.14 and +1.228 are ≈ 6.6 semitones apart (AUDIO_RESEARCH B2)", () => {
    const ratio = mapVoice("heat", 1.228)! / mapVoice("heat", -0.14)!;
    expect(ratio).toBeCloseTo(Math.pow(4, 1.368 / 5), 9);
    expect(12 * Math.log2(ratio)).toBeCloseTo(6.57, 2);
  });
});

describe("heat deviation bands (Anomaly Choir)", () => {
  const m = () => bands("heatDeviation");
  test("band edges and absolute value", () => {
    expect(bandFor(0.3, m()).index).toBe(0);
    expect(bandFor(0.5, m()).index).toBe(1); // upTo is exclusive
    expect(bandFor(-1.2, m()).index).toBe(2); // warm and cold treated the same
    expect(bandFor(2.0, m()).index).toBe(3);
    expect(bandFor(2.0, m()).roughness).toBeGreaterThan(0);
    expect(bandFor(0.3, m()).detuneCents).toBe(0);
  });
});

describe("monsoon: mm/day → drops per step", () => {
  test("demo window means (GPCP 15.104 → 9, 13.706 → 8) = round(mm/day × 0.6)", () => {
    expect(mapVoice("monsoon", 15.104)).toBe(9);
    expect(mapVoice("monsoon", 13.706)).toBe(8);
    for (const v of [0, 3.3, 7.5, 12, 25]) expect(mapVoice("monsoon", v)).toBe(Math.round(v * 0.6));
  });
});

describe("runtime-range rules (water, fires)", () => {
  test("p5–p95 of 1..100 with linear interpolation, nulls ignored", () => {
    const series: (number | null)[] = Array.from({ length: 100 }, (_, i) => i + 1);
    series.splice(10, 0, null, null);
    const r = runtimeRange(series, { range: "p5-p95", transform: "none" })!;
    expect(r.min).toBeCloseTo(5.95, 9);
    expect(r.max).toBeCloseTo(95.05, 9);
  });

  test("empty or all-null series has no range", () => {
    expect(runtimeRange([null, null], runtime("water").input)).toBeNull();
  });

  test("water: range ends map to 80 and 320 Hz; null month is silence", () => {
    const m = runtime("water");
    const range = { min: -10, max: 10 };
    expect(mapRuntime(-10, m, range)).toBeCloseTo(80, 6);
    expect(mapRuntime(10, m, range)).toBeCloseTo(320, 6);
    expect(mapRuntime(0, m, range)).toBeCloseTo(160, 6);
    expect(mapRuntime(null, m, range)).toBeNull();
  });

  test("fires: log1p, zero-to-max → click strength 0..1", () => {
    const m = runtime("fires");
    const counts = [0, 5, 15, 150];
    const r = runtimeRange(counts, m.input)!;
    expect(r).toEqual({ min: 0, max: Math.log1p(150) });
    expect(mapRuntime(150, m, r)).toBeCloseTo(1, 9);
    expect(mapRuntime(0, m, r)).toBeCloseTo(0, 9);
    expect(mapRuntime(15, m, r)).toBeCloseTo(Math.log1p(15) / Math.log1p(150), 9);
  });
});

describe("vegetation: NDVI → Hz", () => {
  test("endpoints", () => {
    expect(mapVoice("vegetation", 0)).toBeCloseTo(150, 6);
    expect(mapVoice("vegetation", 1)).toBeCloseTo(600, 6);
  });
});

describe("stereo and loudness", () => {
  test("pan = lon / 180, clamped", () => {
    expect(panFor(90.4)).toBeCloseTo(0.5022, 4);
    expect(panFor(-180)).toBe(-1);
    expect(panFor(0)).toBe(0);
    expect(panFor(200)).toBe(1);
  });

  test("loudness compensation is off (1) until tuned, and follows (ref/f)^k when on", () => {
    expect(loudnessGain(880)).toBe(1);
    expect(loudnessGain(880, { refHz: 440, exponent: 0.5 })).toBeCloseTo(Math.SQRT1_2, 9);
    expect(loudnessGain(220, { refHz: 440, exponent: 0.5 })).toBeCloseTo(Math.SQRT2, 9);
  });
});

describe("rule text for the Mapping panel", () => {
  test("ocean rule is generated from the numbers", () => {
    const t = ruleText(voiceSpec("ocean"));
    for (const s of ["−5", "35", "220", "880", "°C", "Hz"]) expect(t).toContain(s);
  });

  test("rain rule says logarithmic; bands and runtime rules read sensibly", () => {
    expect(ruleText(voiceSpec("rain"))).toContain("logarithmic");
    expect(ruleText(voiceSpec("heatDeviation"))).toContain("below 0.5: close to normal");
    expect(ruleText(voiceSpec("heatDeviation"))).toContain("1.5 or more: very unusual");
    expect(ruleText(voiceSpec("water"))).toContain("5th to the 95th percentile");
  });

  test("earcons have no rule parts and fall back to their silence text", () => {
    expect(ruleParts(voiceSpec("ping"))).toBeNull();
    expect(ruleText(voiceSpec("ping"))).toBe(voiceSpec("ping").silence);
  });
});

describe("every continuous voice", () => {
  test("maps its legend points inside its output range", () => {
    for (const v of MAPPING.voices) {
      if (v.mapping?.kind !== "continuous") continue;
      const m = v.mapping;
      for (const p of v.legend) {
        const y = mapContinuous(p.value, m)!;
        expect(y).toBeGreaterThanOrEqual(m.output.min);
        expect(y).toBeLessThanOrEqual(m.output.max);
      }
    }
  });
});
