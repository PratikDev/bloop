import { describe, expect, test } from "bun:test";
import { INITIAL_MIXER, channelLevel, masterLevel, type MixerState } from "./mixer-state";
import type { VoiceId } from "./types";

const state = (over: Partial<MixerState>): MixerState => ({ ...INITIAL_MIXER, ...over });

describe("mixer rules", () => {
  test("every voice is at full level by default", () => {
    expect(channelLevel("ocean", INITIAL_MIXER)).toBe(1);
    expect(channelLevel("rain", INITIAL_MIXER)).toBe(1);
  });

  test("mute silences only that voice", () => {
    const s = state({ muted: new Set<VoiceId>(["rain"]) });
    expect(channelLevel("rain", s)).toBe(0);
    expect(channelLevel("ocean", s)).toBe(1);
  });

  test("solo keeps the soloed voice and silences the others", () => {
    const s = state({ solo: "ocean" });
    expect(channelLevel("ocean", s)).toBe(1);
    expect(channelLevel("rain", s)).toBe(0);
  });

  test("a muted voice stays silent even when soloed", () => {
    expect(channelLevel("ocean", state({ solo: "ocean", muted: new Set<VoiceId>(["ocean"]) }))).toBe(0);
  });

  test("per-voice volume sets the level, clamped to 0..1, and mute/solo still win", () => {
    expect(channelLevel("ocean", state({ voiceVolume: { ocean: 0.4 } }))).toBeCloseTo(0.4, 9);
    expect(channelLevel("rain", state({ voiceVolume: { ocean: 0.4 } }))).toBe(1);
    expect(channelLevel("ocean", state({ voiceVolume: { ocean: 7 } }))).toBe(1);
    expect(channelLevel("ocean", state({ voiceVolume: { ocean: -1 } }))).toBe(0);
    expect(channelLevel("ocean", state({ voiceVolume: { ocean: 0.4 }, solo: "rain" }))).toBe(0);
    expect(channelLevel("ocean", state({ voiceVolume: { ocean: 0.4 }, muted: new Set<VoiceId>(["ocean"]) }))).toBe(0);
  });

  test("master level: capped by masterGain, scaled by volume, 0 when all muted", () => {
    expect(masterLevel(INITIAL_MIXER, 0.8)).toBeCloseTo(0.8, 9);
    expect(masterLevel(state({ volume: 0.5 }), 0.8)).toBeCloseTo(0.4, 9);
    expect(masterLevel(state({ volume: 3 }), 0.8)).toBeCloseTo(0.8, 9);
    expect(masterLevel(state({ volume: -1 }), 0.8)).toBe(0);
    expect(masterLevel(state({ allMuted: true }), 0.8)).toBe(0);
  });
});
