import { describe, expect, test } from "bun:test";
import { en } from "@/lib/i18n";
import { bn } from "@/lib/i18n/bn";
import { soundChip, sonarTrend } from "./sound-captions";

const value = (track: string, v: number) => ({ key: "caption.value", params: { track, value: v } });

describe("sound captions", () => {
  test("a value caption gets a trend once there is one to compare with; tiny changes get none", () => {
    const last = new Map<string, number>();
    expect(soundChip(value("ocean", 28), last)).toBeNull();
    expect(soundChip(value("ocean", 28.4), last)).toBe("sound.toneUp");
    expect(soundChip(value("ocean", 28.42), last)).toBeNull();
    expect(soundChip(value("ocean", 27), last)).toBe("sound.toneDown");
    expect(soundChip(value("rain", 1), last)).toBeNull();
    expect(soundChip(value("rain", 3), last)).toBe("sound.dropsUp");
    expect(soundChip(value("rain", 0.5), last)).toBe("sound.dropsDown");
  });

  test("beats and sonar pings say what they mean", () => {
    const last = new Map<string, number>();
    expect(soundChip({ key: "caption.unison", params: {} }, last)).toBe("sound.beatsDisagree");
    expect(soundChip({ key: "caption.compare.pair", params: {} }, last)).toBe("sound.beatsDiffer");
    expect(soundChip({ key: "caption.sonar.ping", params: { trend: sonarTrend(0.2, 0.5) } }, last)).toBe("sound.pingNearer");
    expect(soundChip({ key: "caption.sonar.ping", params: { trend: sonarTrend(0.5, 0.2) } }, last)).toBe("sound.pingFarther");
    expect(soundChip({ key: "caption.sonar.ping", params: { trend: sonarTrend(null, 0.2) } }, last)).toBe("sound.pingSame");
    expect(soundChip({ key: "caption.legend", params: {} }, last)).toBeNull();
  });

  test("every note has English and a Bangla draft", () => {
    for (const k of ["sound.toneUp", "sound.toneDown", "sound.dropsUp", "sound.dropsDown", "sound.pingNearer", "sound.pingFarther", "sound.pingSame", "sound.beatsDiffer", "sound.beatsDisagree"] as const) {
      expect(en[k].length).toBeGreaterThan(0);
      expect(bn[k]).toBeDefined();
    }
  });
});
