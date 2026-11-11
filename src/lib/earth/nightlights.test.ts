// P4, night lights: the pitches follow the rule (log radiance → exponential Hz); cloud-masked nights are rests with the
// gap text (never "dark"); the product and satellite come from the file, which is not S-NPP.
import { describe, expect, test } from "bun:test";
import { violations } from "@/a11y/brailleText";
import { continuousRule } from "@/lib/audio/mapping";
import { bindT } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import type { NightLightsFile } from "@/types/data-contract";
import { cityNear, LIGHTS_VOICE, lightsBrailleLine, lightsIsSnpp, lightsSatellite, lightsStepLine, lightsSteps } from "./nightlights";

const file = readData<NightLightsFile>("context/nightlights.json");
const t = bindT("en");

describe("night lights", () => {
  test("pitch follows the log rule: a tenfold step in radiance is the same pitch ratio everywhere", () => {
    const rule = continuousRule(LIGHTS_VOICE);
    expect(rule.input.scale).toBe("log");
    for (const [city, c] of Object.entries(file.cities)) {
      for (const s of lightsSteps(c)) {
        if (s.radiance === null) continue;
        const tt = (Math.log10(s.radiance) - Math.log10(rule.input.min)) / (Math.log10(rule.input.max) - Math.log10(rule.input.min));
        expect(s.hz, city).toBeCloseTo(rule.output.min * (rule.output.max / rule.output.min) ** Math.min(1, Math.max(0, tt)), 6);
      }
    }
  });
  test("every cloud-masked night is a rest, said as a gap, never as dark or a blackout", () => {
    for (const [city, c] of Object.entries(file.cities)) {
      const steps = lightsSteps(c);
      steps.forEach((s, i) => {
        expect(s.radiance === null).toBe(c.cloud_masked[i]);
        if (s.radiance !== null) return;
        expect(s.hz).toBeNull();
        const line = lightsStepLine(t, "en", file, city, s);
        expect(line).toContain("gap: cloud");
        expect(/\bdark\b|blackout/iu.test(line.replace("not darkness", ""))).toBe(false);
      });
      for (const s of steps) expect(violations(lightsBrailleLine(city, s), 40)).toEqual([]);
    }
  });
  test("the product and satellite are the file's, and not S-NPP", () => {
    expect(lightsSatellite(file)).toBe("NOAA-20");
    expect(file.short_name).toBe("VJ146A2");
    expect(lightsIsSnpp(file)).toBe(false);
  });
  test("a city is 'here' only near its point", () => {
    const d = file.cities.Dhaka;
    expect(cityNear(file, d.lat, d.lon)).toBe("Dhaka");
    expect(cityNear(file, 0, 0)).toBeNull();
  });
});
