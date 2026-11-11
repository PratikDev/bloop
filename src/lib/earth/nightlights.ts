// Night lights: NASA Black Marble daily radiance at named cities (context/nightlights.json; the product and the
// satellite are the file's own: VJ146A2 on NOAA-20 today). Radiance → pitch on a log scale (the "nightLights" rule in
// public/mapping-data.json); a cloud-masked night is a rest, "gap: cloud", never darkness and never a blackout.

import { clean } from "@/a11y/brailleText";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { fetchJson } from "@/lib/data/fetch";
import { formatDay, formatFixed, type BoundT, type Lang } from "@/lib/i18n";
import type { NightLightsCity, NightLightsFile } from "@/types/data-contract";
import { satelliteIn } from "./firms";
import { EARTH_PATHS } from "./paths";

export const LIGHTS_VOICE = "nightLights";
const RADIANCE_DECIMALS = 1;
const KM_PER_DEG = 111.2;
/** A city counts as "here" within this distance of the needle (a design choice for Ask Bloop and the link). */
const LIGHTS_NEAR_KM = 60;

let cached: Promise<NightLightsFile> | null = null;
export function loadNightLights(): Promise<NightLightsFile> {
  cached ??= fetchJson<NightLightsFile>(EARTH_PATHS.nightLights);
  cached.catch(() => {
    cached = null;
  });
  return cached;
}

export interface LightsStep {
  day: string;
  /** null: a cloud-masked night (a gap), never a zero. */
  radiance: number | null;
  /** The note's pitch through the rule; null on a gap (a rest). */
  hz: number | null;
  validShare: number;
}

export function lightsSteps(city: NightLightsCity): LightsStep[] {
  const rule = continuousRule(LIGHTS_VOICE);
  return city.days.map((day, i) => {
    const r = city.cloud_masked[i] ? null : city.radiance[i];
    return { day, radiance: r, hz: r === null ? null : mapContinuous(r, rule), validShare: city.valid_share[i] };
  });
}

/** The satellite the file names (its title and datasets), e.g. "NOAA-20"; null if it names none. */
export const lightsSatellite = (file: NightLightsFile): string | null => satelliteIn([file.title, ...file.datasets.map((d) => d.name)].join(" "));

/** The file's city nearest a point, within LIGHTS_NEAR_KM; null if none is that near. */
export function cityNear(file: NightLightsFile, lat: number, lon: number): string | null {
  let best: string | null = null;
  let bestKm = LIGHTS_NEAR_KM;
  for (const [name, c] of Object.entries(file.cities)) {
    const km = Math.hypot(c.lat - lat, (c.lon - lon) * Math.cos((lat * Math.PI) / 180)) * KM_PER_DEG;
    if (km <= bestKm) {
      best = name;
      bestKm = km;
    }
  }
  return best;
}

export function lightsStepLine(t: BoundT, lang: Lang, file: NightLightsFile, city: string, s: LightsStep): string {
  return s.radiance === null
    ? t("earth.lights.gap", { city: t("data.text", { text: city }), day: formatDay(s.day, lang) })
    : t("earth.lights.value", { city: t("data.text", { text: city }), day: formatDay(s.day, lang), value: formatFixed(s.radiance, lang, RADIANCE_DECIMALS), unit: file.units });
}

/** The latest clear night, said for Ask Bloop and Describe ("Dhaka, 26 Oct 2026: 30.1 nW·cm⁻²·sr⁻¹"), or its gap. */
export function latestLine(t: BoundT, lang: Lang, file: NightLightsFile, city: string): string {
  const steps = lightsSteps(file.cities[city]);
  const clear = [...steps].reverse().find((s) => s.radiance !== null);
  const last = steps[steps.length - 1];
  return clear ? lightsStepLine(t, lang, file, city, clear) + (last.radiance === null ? ` ${lightsStepLine(t, lang, file, city, last)}` : "") : lightsStepLine(t, lang, file, city, last);
}

/** "Dhaka 26 Oct: 30.1 nW" or "Dhaka 25 Oct: gap cloud": braille-safe (ASCII, Western digits). */
export function lightsBrailleLine(city: string, s: LightsStep): string {
  const d = `${Number(s.day.slice(8, 10))}/${Number(s.day.slice(5, 7))}`;
  return clean(s.radiance === null ? `${city} ${d}: gap cloud` : `${city} ${d}: ${s.radiance.toFixed(RADIANCE_DECIMALS)} nW`);
}
