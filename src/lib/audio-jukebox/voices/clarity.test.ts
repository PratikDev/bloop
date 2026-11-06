// The clarity echo's combs feed back through a lowpass: the loop must lose energy at every frequency, or the echo grows
// without bound (it did in Chromium with the default Q: Sound terrain reached RMS 92 in 12 s).
import { describe, expect, test } from "bun:test";
import { DAMPING_HZ, DAMPING_Q_DB, MAX_FEEDBACK } from "./clarity";

/** |H(f)| of a Web Audio lowpass BiquadFilterNode (Audio EQ Cookbook; Q in dB, as the spec defines it for lowpass). */
function lowpassGain(f: number, f0: number, qDb: number, fs = 48_000): number {
  const w0 = (2 * Math.PI * f0) / fs;
  const alpha = Math.sin(w0) / (2 * 10 ** (qDb / 20));
  const c = Math.cos(w0);
  const [b0, b1, b2, a0, a1, a2] = [(1 - c) / 2, 1 - c, (1 - c) / 2, 1 + alpha, -2 * c, 1 - alpha];
  const w = (2 * Math.PI * f) / fs;
  const re = (x0: number, x1: number, x2: number) => x0 + x1 * Math.cos(w) + x2 * Math.cos(2 * w);
  const im = (x1: number, x2: number) => -(x1 * Math.sin(w) + x2 * Math.sin(2 * w));
  return Math.hypot(re(b0, b1, b2), im(b1, b2)) / Math.hypot(re(a0, a1, a2), im(a1, a2));
}

const peak = (qDb: number) => Math.max(...Array.from({ length: 2000 }, (_, i) => lowpassGain(10 + i * 12, DAMPING_HZ, qDb)));

describe("clarity echo", () => {
  test("loop gain stays below 1 at every frequency (the echo always decays)", () => {
    expect(peak(DAMPING_Q_DB) * MAX_FEEDBACK).toBeLessThan(1);
  });
  test("the default Q would not (the bug this guards against)", () => {
    expect(peak(1) * MAX_FEEDBACK).toBeGreaterThan(1);
  });
});
