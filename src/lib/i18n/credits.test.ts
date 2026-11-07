// Mentor item 5: every credit under "Data in this app" plays somewhere (checked against the shipped files), the
// sources that don't play sit on the "Used in our testing (not playable)" line, and the unfinished Then vs Now parts
// stay hidden unless their feature flag is on.
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { ALL_VIEW_PARTS, VIEW_PARTS, visibleParts } from "@/components/ThenNow/parts";
import { listedRelated } from "@/lib/data/official";
import type { OfficialIndex } from "@/types/data-contract";
import { readData } from "./data-sentences";
import { CREDIT_NAMES, DATA_CREDITS, TESTING_CREDITS, type PlaysIn } from "./credits";
import { bindT } from "./index";

const official = readData<OfficialIndex>("official/index.json");
const related = listedRelated(readData<OfficialIndex>("related/index.json"));

/** Where a credit says it plays exists in what the app ships and lists. */
function plays(p: PlaysIn): boolean {
  switch (p.kind) {
    case "thenNow":
      return VIEW_PARTS.includes(p.part);
    case "related":
      return related.records.some((r) => r.record === p.record) && existsSync(`public/data/related/${p.record}/manifest.json`);
    case "official":
      return official.records.some((r) => r.record === p.record) && existsSync(`public/data/official/${p.record}/manifest.json`);
    case "unison":
      return existsSync(`public/data/${p.file}`);
  }
}

describe("credits", () => {
  test.each(DATA_CREDITS.map((c) => [c.name, c] as const))("%s plays somewhere in the app", (_, c) => {
    expect(c.plays.length).toBeGreaterThan(0);
    for (const p of c.plays) expect([c.name, p, plays(p)]).toEqual([c.name, p, true]);
  });

  test("sources that don't play are only on the testing line", () => {
    const en = bindT("en");
    for (const name of TESTING_CREDITS) {
      expect(en("credits.data")).not.toContain(name.split(" (")[0]);
      expect(en("credits.testing")).toContain(name);
    }
    expect(en("credits.testing")).toStartWith("Used in our testing (not playable):");
    expect(CREDIT_NAMES.data).not.toMatch(/FIRMS|MOD13Q1|GLOBE|GPCC/u);
  });
});

describe("Then vs Now parts", () => {
  test("fires and vegetation are hidden unless the flag is on; their code stays", () => {
    expect(VIEW_PARTS).toEqual(["heat", "monsoon", "water"]);
    expect(visibleParts(true)).toEqual(ALL_VIEW_PARTS);
  });
});
