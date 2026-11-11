// PURE: the letter to the future on DATA's records (integration wire), built only from their files: the fire-weather
// class at the needle (an experimental forecast category), the landslide exposure class (a modelled category), and a
// city's night-light radiance (measured; a cloud-masked night is a gap). A category letter records the class and the
// record's own "not a measurement" label, never a value.

import { classLabel } from "@/lib/earth/class-grid";
import type { LightsStep } from "@/lib/earth/nightlights";
import type { BoundT } from "@/lib/i18n";
import type { FwiClassMetadata, LandslideClassMetadata, NightLightsFile } from "@/types/data-contract";
import type { LetterInput } from "./letter";

const day = (iso: string) => iso.slice(0, 10);

/** Tomorrow's fire weather at the needle: its class for the forecast day. */
export function fireLetter(t: BoundT, meta: FwiClassMetadata, code: number, forDay: string, place: string): LetterInput {
  const label = t("data.text", { text: classLabel(meta, code) ?? String(code) });
  return { place, date: forDay, reading: { kind: "class", record: t("earth.fire.title"), label, note: t("earth.fire.fwiLabel") }, source: meta.credit, link: meta.svs_page };
}

/** Landslide exposure at the needle: its class on the frame's day. */
export function slideLetter(t: BoundT, meta: LandslideClassMetadata, code: number, place: string): LetterInput {
  const label = t("data.text", { text: classLabel(meta, code) ?? String(code) });
  return { place, date: day(meta.frame_time_utc), reading: { kind: "class", record: t("earth.slide.title"), label, note: t("earth.slide.label") }, source: meta.credit, link: meta.svs_page };
}

/** The file's unit with its middle dots as spaces ("nW cm⁻² sr⁻¹"): the braille rules ban the dot. */
const safeUnit = (unit: string) => unit.replaceAll("·", " ");

/** A city's night: its radiance, or a gap. */
export function lightsLetter(t: BoundT, file: NightLightsFile, city: string, step: LightsStep): LetterInput {
  const reading = step.radiance === null ? ({ kind: "gap" } as const) : ({ kind: "radiance", value: step.radiance, unit: safeUnit(file.units) } as const);
  return { place: t("data.text", { text: city }), date: step.day, reading, source: file.credit, link: null };
}
