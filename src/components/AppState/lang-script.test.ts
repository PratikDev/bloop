// Mentor item 3: the inline head script sets <html lang> from the saved prefs, and does nothing (no throw) when the
// value is missing or unknown, or storage is blocked.
import { afterEach, describe, expect, test } from "bun:test";
import { LANG_SCRIPT } from "./lang-script";
import { PREFS_STORAGE_KEY } from "./prefs";

const g = globalThis as unknown as { localStorage?: { getItem: (k: string) => string | null }; document?: { documentElement: { lang: string } } };

function run(stored: string | null | "throw"): string {
  const html = { lang: "en" };
  g.document = { documentElement: html };
  g.localStorage = {
    getItem: (k) => {
      if (stored === "throw") throw new Error("SecurityError");
      return k === PREFS_STORAGE_KEY ? stored : null;
    },
  };
  new Function(LANG_SCRIPT)();
  return html.lang;
}

afterEach(() => {
  delete g.localStorage;
  delete g.document;
});

describe("LANG_SCRIPT", () => {
  test("a saved Bangla choice sets lang=bn", () => expect(run(JSON.stringify({ lang: "bn" }))).toBe("bn"));
  test("a saved English choice keeps lang=en", () => expect(run(JSON.stringify({ lang: "en" }))).toBe("en"));
  test("nothing saved, an unknown value, broken JSON or blocked storage: lang stays en, nothing throws", () => {
    for (const stored of [null, JSON.stringify({ lang: "fr" }), "{not json", "throw" as const]) expect(run(stored)).toBe("en");
  });
});
