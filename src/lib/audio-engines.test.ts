// Which engine each page plays on (src/lib/audio-engines.ts): the Jukebox engine for the Official records and the
// Turntable, L2 for every other page; the live voices sound on that engine only.

import { describe, expect, test } from "bun:test";
import type { Mode } from "@/components/AppState/reducer";
import { audio as l2 } from "@/lib/audio-adapter";
import { audio as jukebox } from "@/lib/audio-jukebox";
import { engineFor, liveEngine, otherEngine } from "./audio-engines";

const MODES: Mode[] = ["home", "explore", "story", "thenNow", "how", "turntable", "official"];

describe("audio engines", () => {
  test("the Official records and the Turntable play on the Jukebox engine, every other page on L2", () => {
    expect(MODES.filter((m) => engineFor(m) === "jukebox")).toEqual(["turntable", "official"]);
  });

  test("a page's live engine and the other one are never the same", () => {
    for (const m of MODES) {
      expect(liveEngine(m)).toBe(engineFor(m) === "jukebox" ? jukebox : l2);
      expect(otherEngine(m)).not.toBe(liveEngine(m));
    }
  });
});
