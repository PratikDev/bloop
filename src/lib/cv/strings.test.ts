// Every CV/ML string (en/cv-*.ts, bn/cv-*.ts) passes the braille text rules (src/a11y/brailleText.ts), has its Bangla
// draft, and every named box and budget axis has a Bangla name (a new one can't ship in English only).
import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import { cvEn } from "@/lib/i18n/en/cv";
import { cvBn } from "@/lib/i18n/bn/cv";
import { NAMED_BOXES } from "./boxes";
import { ERROR_BUDGET } from "./error-budget";

/** Sample slot values for rendering a template (any slot a cv string uses). */
const SAMPLE = new Proxy({} as Record<string, string>, { get: (_, k) => (k === "id" ? "bayOfBengal" : k === "count" ? "2" : "1") });
const render = (v: unknown) => (typeof v === "function" ? (v as (p: Record<string, string>) => string)(SAMPLE) : String(v));
const rules = (s: string) => violations(s).filter((v) => v !== "stray spaces");

describe("CV/ML strings", () => {
  test("English: braille-safe", () => {
    for (const [k, v] of Object.entries(cvEn)) expect([k, rules(render(v))]).toEqual([k, []]);
  });

  test("Bangla: every key drafted, braille-safe", () => {
    expect(Object.keys(cvEn).filter((k) => !(k in cvBn))).toEqual([]);
    for (const [k, v] of Object.entries(cvBn)) expect([k, rules(render(v))]).toEqual([k, []]);
  });

  test("every box and budget axis has a Bangla name", () => {
    const bn = (key: "cv.box.name" | "cv.axis", id: string) => (cvBn[key] as (p: { id: string }) => string)({ id });
    for (const b of NAMED_BOXES) expect(bn("cv.box.name", b.id)).not.toBe(b.id);
    for (const a of ERROR_BUDGET.axes) expect(bn("cv.axis", a.id)).not.toBe(a.id);
  });
});
