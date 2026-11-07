// Mentor item 2: the sound choice is remembered with the Start it belongs to, and a blocked or broken storage only
// means the defaults (the first-visit dialog), never an error.
import { afterEach, describe, expect, test } from "bun:test";
import { readPrefs, writePrefs } from "./prefs";
import { initialState, reducer } from "./reducer";

type Store = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void };
const g = globalThis as unknown as { localStorage?: Store };

function memoryStorage(): Store {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

const blocked: Store = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("SecurityError");
  },
};

afterEach(() => {
  delete g.localStorage;
});

const save = (s: typeof initialState) =>
  writePrefs({ lang: s.lang, describe: s.describe, captions: s.captions, builtInVoice: s.builtInVoice, started: s.started, soundChoice: s.soundChoice });

describe("sound choice", () => {
  test("choose sound → reload: started, choice kept", () => {
    g.localStorage = memoryStorage();
    save(reducer(initialState, { type: "start" }));
    expect(readPrefs()).toMatchObject({ started: true, soundChoice: "sound" });
  });

  test("choose silence → reload: started, silent kept", () => {
    g.localStorage = memoryStorage();
    save(reducer(initialState, { type: "startSilent" }));
    expect(readPrefs()).toMatchObject({ started: true, soundChoice: "silent" });
  });

  test("Reset forgets the choice: the first-visit dialog returns", () => {
    g.localStorage = memoryStorage();
    const reset = reducer(reducer(initialState, { type: "start" }), { type: "resetStart" });
    save(reset);
    const p = readPrefs();
    expect(p.started).toBe(false);
    expect(p.soundChoice).toBeUndefined();
  });

  test("a bad stored value is ignored", () => {
    g.localStorage = memoryStorage();
    g.localStorage.setItem("jukebox.prefs.v1", JSON.stringify({ started: true, soundChoice: "loud" }));
    expect(readPrefs()).toEqual({ started: true });
  });

  test("blocked storage: no error, defaults (so the dialog shows)", () => {
    g.localStorage = blocked;
    expect(() => save(reducer(initialState, { type: "start" }))).not.toThrow();
    expect(readPrefs()).toEqual({});
  });
});
