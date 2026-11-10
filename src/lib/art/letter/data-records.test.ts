// The letter on DATA's records (integration wire): built only from their files. A category letter (fire weather,
// landslide exposure) records the class and the record's own "not a measurement" label, never a value; night lights
// record the measured radiance, and a cloud-masked night is a gap, never darkness. EN + BN; braille rules; 40 cells.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { violations } from "@/a11y/brailleText";
import { lightsSteps } from "@/lib/earth/nightlights";
import { bindT, formatFixed, LANGS } from "@/lib/i18n";
import type { FwiClassMetadata, LandslideClassMetadata, NightLightsFile } from "@/types/data-contract";
import { fireLetter, lightsLetter, slideLetter } from "./data-records";
import { LETTER_WIDTH, letterLines, letterText } from "./letter";

const read = <T,>(p: string): T => JSON.parse(readFileSync(join(process.cwd(), "public/data", p), "utf8")) as T;
const fwi = read<FwiClassMetadata>("latest/fwi_class.json");
const slide = read<LandslideClassMetadata>("latest/landslide_class.json");
const lights = read<NightLightsFile>("context/nightlights.json");
const city = Object.keys(lights.cities)[0];
const steps = lightsSteps(lights.cities[city]);
const lit = steps.find((s) => s.radiance !== null);
const gap = steps.find((s) => s.radiance === null);

describe("letters on DATA's records", () => {
  test("fire weather: the class and its forecast label, from the file; no value recorded", () => {
    const t = bindT("en");
    const code = fwi.classes.find((c) => c.code !== 0)!.code;
    const l = fireLetter(t, fwi, code, "2026-11-07", "Dhaka");
    expect(l.reading).toEqual({ kind: "class", record: t("earth.fire.title"), label: fwi.classes.find((c) => c.code === code)!.label, note: t("earth.fire.fwiLabel") });
    expect(l.source).toBe(fwi.credit);
    expect(l.link).toBe(fwi.svs_page);
    const text = letterLines(t, "en", l).join(" ");
    expect(text).toContain("no value recorded");
    expect(text).not.toContain("Measured by");
  });

  test("landslide exposure: the class on the frame's day, labelled modelled", () => {
    const t = bindT("en");
    const l = slideLetter(t, slide, 2, "Cox's Bazar");
    expect(l.date).toBe(slide.frame_time_utc.slice(0, 10));
    expect(letterLines(t, "en", l).join(" ")).toContain(t("earth.slide.label"));
  });

  test("night lights: the radiance is the file's; a cloud-masked night is a gap, never dark", () => {
    const t = bindT("en");
    expect(lit).toBeDefined();
    const l = lightsLetter(t, lights, city, lit!);
    expect(l.reading).toEqual({ kind: "radiance", value: lit!.radiance!, unit: lights.units.replaceAll("·", " ") });
    expect(letterLines(t, "en", l).join(" ")).toContain(formatFixed(lit!.radiance!, "en", 1));
    if (gap) {
      const g = letterLines(t, "en", lightsLetter(t, lights, city, gap)).join(" ");
      expect(g).toContain("A gap, not darkness.");
      expect(g.toLowerCase()).not.toMatch(/\bdark\b(?!ness)/u);
    }
  });

  test("English and Bangla; the saved text passes the braille rules and wraps to 40 cells", () => {
    for (const lang of LANGS) {
      const t = bindT(lang);
      for (const l of [fireLetter(t, fwi, 1, "2026-11-07", "Dhaka"), slideLetter(t, slide, 4, "Cox's Bazar"), lightsLetter(t, lights, city, lit!), ...(gap ? [lightsLetter(t, lights, city, gap)] : [])]) {
        const txt = letterText(t, lang, l);
        for (const line of txt.split("\n")) expect(line.length).toBeLessThanOrEqual(LETTER_WIDTH);
        if (lang === "en") expect(violations(letterLines(t, lang, l).join(" "))).toEqual([]);
      }
    }
  });
});
