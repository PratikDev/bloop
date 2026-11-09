import { describe, expect, test } from "bun:test";
import { voiceSpec } from "@/lib/audio/mapping";
import { LIVE_VOICES, type AudioEvent, type LiveVoiceId } from "@/lib/audio-adapter/types";
import {
  createSoundWordPacer,
  legendSoundWord,
  needleSoundWord,
  OCEAN_WARM_FROM_C,
  RAIN_DRUM_FROM_MM,
  SOUND_WORD_GAP_MS,
  SOUND_WORD_SHOW_MS,
  SOUND_WORDS,
  soundWordFor,
  type NeedleReading,
} from "./sound-words";

const rainy: NeedleReading = { lon: 90, oceanC: 28, rainMm: 1, phase: "liquid" };
const drop = (voice: "rain" | "snow", lon = 90): AudioEvent => ({ kind: "drop", voice, time: 1, gain: 0.8, lon });
const oceanCaption = (value: number): AudioEvent => ({ kind: "caption", key: "caption.value", params: { track: "ocean", value } });
const all = () => true;

describe("the words", () => {
  test("every word belongs to a real live voice, and every live voice has a word", () => {
    const voices = new Set<LiveVoiceId>(Object.values(SOUND_WORDS).map((w) => w.voice));
    expect([...voices].sort()).toEqual([...LIVE_VOICES].sort());
    for (const voice of voices) expect(() => voiceSpec(voice)).not.toThrow();
  });
  test("every word has English and Bangla, and is not all-caps", () => {
    for (const w of Object.values(SOUND_WORDS)) {
      expect(w.en.length).toBeGreaterThan(0);
      expect(w.bn.length).toBeGreaterThan(0);
      expect<string>(w.en).toBe(w.en.toLowerCase());
    }
  });
  test("the registers split on the voices' own rules", () => {
    expect(Number.isFinite(RAIN_DRUM_FROM_MM)).toBe(true);
    expect(soundWordFor("rain", RAIN_DRUM_FROM_MM - 0.1)).toBe("rainLight");
    expect(soundWordFor("rain", RAIN_DRUM_FROM_MM)).toBe("rainHeavy");
    expect(soundWordFor("ocean", OCEAN_WARM_FROM_C - 0.1)).toBe("oceanCool");
    expect(soundWordFor("ocean", OCEAN_WARM_FROM_C)).toBe("oceanWarm");
    expect(soundWordFor("snow", 1)).toBe("snow");
  });
});

describe("only for a sound playing at the needle", () => {
  test("a rain drop at the needle in rain gets a word", () => {
    expect(needleSoundWord(drop("rain"), rainy, all)).toBe("rainLight");
  });
  test("no word for a drop away from the needle (a sweep or the legend)", () => {
    expect(needleSoundWord(drop("rain", 0), rainy, all)).toBeNull();
  });
  test("no word for a voice that cannot be heard", () => {
    expect(needleSoundWord(drop("rain"), rainy, () => false)).toBeNull();
    expect(needleSoundWord(oceanCaption(28), rainy, () => false)).toBeNull();
  });
  test("no word when the needle is dry, or the drop is the other phase", () => {
    expect(needleSoundWord(drop("rain"), { ...rainy, rainMm: 0, phase: "dry" }, all)).toBeNull();
    expect(needleSoundWord(drop("snow"), rainy, all)).toBeNull();
    expect(needleSoundWord(drop("snow"), { ...rainy, phase: "frozen" }, all)).toBe("snow");
  });
  test("the ocean's word follows its value caption, never another track's caption", () => {
    expect(needleSoundWord(oceanCaption(28), rainy, all)).toBe("oceanWarm");
    expect(needleSoundWord(oceanCaption(4), rainy, all)).toBe("oceanCool");
    expect(needleSoundWord({ kind: "caption", key: "caption.value", params: { track: "rain", value: 3 } }, rainy, all)).toBeNull();
    expect(needleSoundWord(oceanCaption(28), { ...rainy, oceanC: null }, all)).toBeNull();
  });
  test("other events never make a word", () => {
    expect(needleSoundWord({ kind: "step", player: "sweep", index: 0, total: 3, time: 1 }, rainy, all)).toBeNull();
  });
});

describe("pacing", () => {
  test("at most one word per gap, and a word has gone before the next can come", () => {
    const pacer = createSoundWordPacer();
    expect(pacer.allow(0, SOUND_WORD_GAP_MS)).toBe(true);
    expect(pacer.allow(SOUND_WORD_GAP_MS - 1, SOUND_WORD_GAP_MS)).toBe(false);
    expect(pacer.allow(SOUND_WORD_GAP_MS, SOUND_WORD_GAP_MS)).toBe(true);
    expect(SOUND_WORD_SHOW_MS).toBeLessThan(SOUND_WORD_GAP_MS);
  });
});

describe("the legend", () => {
  test("each legend step of the live voices has a word", () => {
    for (const voice of LIVE_VOICES) for (const p of voiceSpec(voice).legend) expect(legendSoundWord(voice, p.label)).not.toBeNull();
  });
  test("an unknown label has none", () => {
    expect(legendSoundWord("rain", "no such step")).toBeNull();
  });
});
