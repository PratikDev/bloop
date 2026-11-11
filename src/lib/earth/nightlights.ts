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
  radiance: number | null;
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

export const lightsSatellite = (file: NightLightsFile): string | null => satelliteIn([file.title, ...file.datasets.map((d) => d.name)].join(" "));

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

export function latestLine(t: BoundT, lang: Lang, file: NightLightsFile, city: string): string {
  const steps = lightsSteps(file.cities[city]);
  const clear = [...steps].reverse().find((s) => s.radiance !== null);
  const last = steps[steps.length - 1];
  return clear ? lightsStepLine(t, lang, file, city, clear) + (last.radiance === null ? ` ${lightsStepLine(t, lang, file, city, last)}` : "") : lightsStepLine(t, lang, file, city, last);
}

export function lightsBrailleLine(city: string, s: LightsStep): string {
  const d = `${Number(s.day.slice(8, 10))}/${Number(s.day.slice(5, 7))}`;
  return clean(s.radiance === null ? `${city} ${d}: gap cloud` : `${city} ${d}: ${s.radiance.toFixed(RADIANCE_DECIMALS)} nW`);
}
