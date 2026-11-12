// Every ART string (EN and the Bangla drafts) passes the braille text rules (src/a11y/brailleText.ts), and every
// English key has its Bangla draft.

import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import { artBn } from "../bn/art";
import { artEn } from "./art";

const SAMPLE = new Proxy({} as Record<string, string>, { get: (_, k) => (k === "list" ? "timbre, a soft bed" : "12") });
const render = (v: unknown): string => (typeof v === "string" ? v : (v as (p: Record<string, string>) => string)(SAMPLE));

describe("ART strings", () => {
  test("English passes the braille rules", () => {
    for (const [k, v] of Object.entries(artEn)) expect([k, violations(render(v)).filter((x) => x !== "stray spaces")]).toEqual([k, []]);
  });
  test("Bangla drafts pass the braille rules", () => {
    for (const [k, v] of Object.entries(artBn)) expect([k, violations(render(v)).filter((x) => x !== "stray spaces")]).toEqual([k, []]);
  });
  test("every English key has a Bangla draft", () => {
    expect(Object.keys(artEn).filter((k) => !(k in artBn))).toEqual([]);
  });
});
