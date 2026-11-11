// D: the meters against BS.1770's own reference points: a 997 Hz sine at 0 dBFS in one channel reads −3.01 LUFS; 20 dB
// quieter reads 20 LU less; silence is −Infinity; true peak finds an inter-sample peak a sample peak misses; flatness
// tells a tone from noise.
import { describe, expect, test } from "bun:test";
import { filter, highpass, integratedLoudness, spectralFlatness, truePeakDb } from "./loudness";

const FS = 48000;
const sine = (hz: number, amp: number, sec: number, phase = 0) => Float64Array.from({ length: FS * sec }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / FS + phase));

describe("loudness meters", () => {
  test("BS.1770 reference: a full-scale 997 Hz sine in one channel is −3.01 LUFS", () => {
    expect(integratedLoudness([sine(997, 1, 5)], FS)).toBeCloseTo(-3.01, 1);
    expect(integratedLoudness([sine(997, 0.1, 5)], FS)).toBeCloseTo(-23.01, 1);
    expect(integratedLoudness([new Float64Array(FS * 2)], FS)).toBe(-Infinity);
  });

  test("true peak sees between the samples", () => {
    const x = sine(FS / 4, 1, 1, Math.PI / 4); // samples at ±0.707, real peak 1
    expect(Math.max(...x.slice(0, 100).map(Math.abs))).toBeLessThan(0.71);
    expect(truePeakDb([x.slice(0, 2000)])).toBeGreaterThan(-0.5);
  });

  test("a 200 Hz high-pass keeps a 440 Hz tone and cuts 50 Hz", () => {
    const rms = (a: ArrayLike<number>) => Math.sqrt(Array.from(a).reduce((s, v) => s + v * v, 0) / a.length);
    expect(rms(filter(sine(440, 1, 1), highpass(FS, 200)))).toBeGreaterThan(0.6);
    expect(rms(filter(sine(50, 1, 1), highpass(FS, 200)))).toBeLessThan(0.1);
  });

  test("flatness: tone near 0, noise near 1", () => {
    let seed = 1;
    const noise = Float64Array.from({ length: 2048 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1);
    expect(spectralFlatness(sine(440, 1, 1))).toBeLessThan(0.05);
    expect(spectralFlatness(noise)).toBeGreaterThan(0.4);
  });
});
