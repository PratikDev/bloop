// Landslide exposure (P3): SVS 5584's LHASA nowcast, decoded by the pipeline into its legend's classes
// (latest/landslide_class.*). A modelled exposure category, never an observed landslide. Its words, braille line and
// description are built here once for the record, its transcript and Ask Bloop.

import { clean } from "@/a11y/brailleText";
import { formatDay, type BoundT, type Lang } from "@/lib/i18n";
import type { LandslideClassMetadata } from "@/types/data-contract";
import { classLabel, loadClassGrid, type ClassGrid } from "./class-grid";
import { classesRule, classState, LANDSLIDE_VOICE } from "./classes";
import { EARTH_PATHS } from "./paths";

export type LandslideGrid = ClassGrid<LandslideClassMetadata>;

let cached: Promise<LandslideGrid> | null = null;

export function loadLandslide(): Promise<LandslideGrid> {
  cached ??= loadClassGrid<LandslideClassMetadata>(EARTH_PATHS.landslideMeta, EARTH_PATHS.landslideGrid);
  cached.catch(() => {
    cached = null;
  });
  return cached;
}

/** Cells per class over the whole grid (the pipeline's cells_per_class counts the same). */
export function cellsPerClass(g: LandslideGrid): number[] {
  const out = g.meta.classes.map(() => 0);
  for (const code of g.codes) if (code < out.length) out[code] += 1;
  return out;
}

/** The sound a class makes, in words: a stated silence (with its reason) or a rumble. */
export function slideSoundText(t: BoundT, code: number): string {
  const state = classState(classesRule(LANDSLIDE_VOICE), code);
  if (!state || state.sound === "silence") return t("earth.slide.silent", { why: t("data.text", { text: state?.silence ?? "" }) });
  return t(state.rumble && state.rumble.pulsesPerSecond > 0 ? "earth.slide.rumblePulses" : "earth.slide.rumble");
}

export function slideLine(t: BoundT, lang: Lang, meta: LandslideClassMetadata, code: number): string {
  return t("earth.slide.at", { cls: t("data.text", { text: classLabel(meta, code) ?? "" }), date: formatDay(meta.frame_time_utc.slice(0, 10), lang), sound: slideSoundText(t, code) });
}

/** "LHASA moderate; rumble": braille-safe, short. */
export function slideBrailleLine(meta: LandslideClassMetadata, code: number): string {
  const state = classState(classesRule(LANDSLIDE_VOICE), code);
  return clean(`LHASA ${classLabel(meta, code) ?? code}; ${state?.sound === "rumble" ? "rumble" : "silence"}`);
}

export function slideDescription(t: BoundT, lang: Lang, meta: LandslideClassMetadata, code: number, level: "brief" | "standard" | "detailed", place: string): string {
  const brief = `${place}: ${slideLine(t, lang, meta, code)}`;
  if (level === "brief") return brief;
  const standard = `${brief} ${t("earth.slide.label")}`;
  return level === "standard" ? standard : `${standard} ${t("data.text", { text: meta.disclosure })}`;
}
