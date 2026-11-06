// The Bangla fallback: every key is listed in docs/i18n/TO_TRANSLATE.md until it is translated, and English
// never leaks a key Bangla doesn't know. `bun run i18n:todo` rewrites the list.

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { captionText, en, UNTRANSLATED_KEYS } from "./index";
import { toTranslateMarkdown } from "./to-translate";

const DOC = new URL("../../../docs/i18n/TO_TRANSLATE.md", import.meta.url);

describe("Bangla strings", () => {
  test("docs/i18n/TO_TRANSLATE.md lists exactly the keys Bangla doesn't have yet", () => {
    const expected = toTranslateMarkdown();
    if (process.env.UPDATE_TO_TRANSLATE === "1") writeFileSync(DOC, expected, "utf8");
    expect(existsSync(DOC) ? readFileSync(DOC, "utf8") : "").toBe(expected);
  });

  test("an untranslated key shows its English text in Bangla", () => {
    const key = UNTRANSLATED_KEYS.find((k) => typeof en[k] === "string");
    if (key) expect(captionText("bn", key, {})).toBe(captionText("en", key, {}));
  });
});
