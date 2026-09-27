import { describe, expect, test } from "bun:test";
import { INITIAL_MIXER, channelOpen, masterLevel, type MixerState } from "./mixer-state";
import type { VoiceId } from "./types";

const state = (over: Partial<MixerState>): MixerState => ({ ...INITIAL_MIXER, ...over });

describe("mixer rules", () => {
  test("everything is open by default", () => {
    expect(channelOpen("ocean", INITIAL_MIXER)).toBe(true);
    expect(channelOpen("rain", INITIAL_MIXER)).toBe(true);
  });

  test("mute closes only that voice", () => {
    const s = state({ muted: new Set<VoiceId>(["rain"]) });
    expect(channelOpen("rain", s)).toBe(false);
    expect(channelOpen("ocean", s)).toBe(true);
  });

  test("solo keeps the soloed voice and closes the others", () => {
    const s = state({ solo: "ocean" });
    expect(channelOpen("ocean", s)).toBe(true);
    expect(channelOpen("rain", s)).toBe(false);
  });

  test("a muted voice stays silent even when soloed", () => {
    expect(channelOpen("ocean", state({ solo: "ocean", muted: new Set<VoiceId>(["ocean"]) }))).toBe(false);
  });

  test("master level: capped by masterGain, scaled by volume, 0 when all muted", () => {
    expect(masterLevel(INITIAL_MIXER, 0.8)).toBeCloseTo(0.8, 9);
    expect(masterLevel(state({ volume: 0.5 }), 0.8)).toBeCloseTo(0.4, 9);
    expect(masterLevel(state({ volume: 3 }), 0.8)).toBeCloseTo(0.8, 9);
    expect(masterLevel(state({ volume: -1 }), 0.8)).toBe(0);
    expect(masterLevel(state({ allMuted: true }), 0.8)).toBe(0);
  });
});
