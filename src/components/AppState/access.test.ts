// Accessibility core, step 1: where a spoken line goes, which channels a step fires, and that the choices are
// remembered (or dropped when the saved value isn't one of theirs).
import { afterEach, describe, expect, test } from "bun:test";
import { ACCESS_DEFAULTS, ACCESS_VALUES, speechOut, stepSound, stepText } from "./access";
import { pickPrefs, readPrefs, writePrefs, PREFS_STORAGE_KEY } from "./prefs";
import { initialState, reducer } from "./reducer";

const g = globalThis as unknown as { localStorage?: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } };
const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
afterEach(() => {
  delete g.localStorage;
});

describe("speech routing", () => {
  test("with the core off, the original built-in voice switch decides (nothing changes)", () => {
    for (const speechMode of ACCESS_VALUES.speechMode) {
      expect(speechOut({ ...ACCESS_DEFAULTS, speechMode, builtInVoice: true }, false)).toBe("voice");
      expect(speechOut({ ...ACCESS_DEFAULTS, speechMode, builtInVoice: false }, false)).toBe("screenReader");
    }
  });

  test("with the core on, the speech mode decides, whatever the old switch says", () => {
    for (const speechMode of ACCESS_VALUES.speechMode)
      for (const builtInVoice of [true, false]) expect(speechOut({ ...ACCESS_DEFAULTS, speechMode, builtInVoice }, true)).toBe(speechMode);
  });

  test("the default is the screen reader", () => {
    expect(initialState.speechMode).toBe("screenReader");
  });
});

describe("text / sound / both", () => {
  test("each step sends text unless sound only, and sound unless text only", () => {
    expect([stepText({ channels: "both" }, true), stepSound({ channels: "both" }, true)]).toEqual([true, true]);
    expect([stepText({ channels: "text" }, true), stepSound({ channels: "text" }, true)]).toEqual([true, false]);
    expect([stepText({ channels: "sound" }, true), stepSound({ channels: "sound" }, true)]).toEqual([false, true]);
  });

  test("with the core off, both always fire", () => {
    for (const channels of ACCESS_VALUES.channels) expect([stepText({ channels }, false), stepSound({ channels }, false)]).toEqual([true, true]);
  });
});

describe("remembered", () => {
  test("a choice survives a reload", () => {
    g.localStorage = memory();
    const s = reducer(initialState, { type: "setAccess", patch: { speechMode: "voice", verbosity: "detailed", channels: "sound" } });
    writePrefs(pickPrefs(s));
    expect(readPrefs()).toMatchObject({ speechMode: "voice", verbosity: "detailed", channels: "sound" });
  });

  test("a saved value that isn't one of the choice's is dropped", () => {
    g.localStorage = memory();
    g.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ speechMode: "shout", verbosity: 3, channels: null }));
    const prefs = readPrefs();
    expect("speechMode" in prefs || "verbosity" in prefs || "channels" in prefs).toBe(false);
  });
});
