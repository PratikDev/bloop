import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { APP_VOICES, ruleParts } from "@/lib/audio/mapping";
import { readData, untranslatedSentences } from "../data-sentences";
import { tableCell } from "../to-translate";
import { translateData } from "./data";
import { missingRuleWords, ruleTextBn } from "./rules";

/** docs/i18n/TO_TRANSLATE.md: a sentence listed there shows in English until a teammate translates it. */
const doc = readFileSync("docs/i18n/TO_TRANSLATE.md", "utf8");

describe("translateData", () => {
  test("translates every data-file sentence the UI shows, with Bengali digits only (or lists it to translate)", () => {
    const missed = untranslatedSentences().filter((s) => !doc.includes(`| ${tableCell(s)} |`));
    expect(missed).toEqual([]);
  });

  test("translates L1's note after a dataset name, keeping the name", () => {
    const { source_dataset } = readData<{ source_dataset: string }>("latest/rain.json");
    const [name] = source_dataset.split(":");
    expect(translateData(source_dataset)).toStartWith(`${name}: নতুন`);
  });

  test("takes the numbers from the source sentence", () => {
    expect(translateData("Single 250 m pixels.")).toBe("একক ২৫০ মিটার পিক্সেল।");
    expect(translateData("−1 °C")).toBe("−১ °সে");
    expect(translateData("3° GRACE cell 3°S–0°N, 36°E–39°E")).toBe("৩° GRACE সেল ৩° দক্ষিণ–০° উত্তর, ৩৬° পূর্ব–৩৯° পূর্ব");
  });

  test("leaves a sentence it doesn't know in English", () => {
    expect(translateData("A sentence L1 wrote later.")).toBe("A sentence L1 wrote later.");
    expect(translateData("Single 250 m pixels, newly reworded.")).toBe("Single 250 m pixels, newly reworded.");
  });
});

describe("ruleTextBn", () => {
  test("builds a Bangla rule for every voice the Mapping panel shows, with no Latin digits (or lists it to translate)", () => {
    for (const voice of APP_VOICES) {
      const text = ruleTextBn(voice);
      expect(text.length).toBeGreaterThan(0);
      if (!ruleParts(voice)) continue;
      if (missingRuleWords(voice).length) expect(doc).toContain(`| \`${voice.id}\` |`);
      else expect(text).not.toMatch(/[0-9]/);
    }
  });
});
