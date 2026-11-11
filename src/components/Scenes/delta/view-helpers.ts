// The Delta scene's constants and text helpers, used by DeltaView.
import { mapVoice } from "@/lib/audio/mapping";
import { type LatLon } from "@/lib/data";
import { formatFixed, formatSigned, type Lang } from "@/lib/i18n";
import type { GraceBoxName } from "@/types/data-contract";
import { type TT } from "../../Turntable/i18n";
import type { DeltaRiverName } from "./use-delta-data";

export const START: LatLon = { lat: 23.81, lon: 90.41 };
export const STEP_DEG = 0.1;
export const BIG_STEP_DEG = 0.5;
export const ZOOM_STEP = 0.85;
export const DEFAULT_SPEED = 2;
export const BOXES: readonly GraceBoxName[] = ["Bangladesh", "NW_India"];
export const BOX_TEXT = { Bangladesh: "scenes.delta.bd", NW_India: "scenes.delta.nw" } as const;
export const RIVER_TEXT = { Ganges: "scenes.delta.river.Ganges", Brahmaputra: "scenes.delta.river.Brahmaputra" } as const satisfies Record<DeltaRiverName, string>;
/** The water legend's ramp: dry ground to the water table's colour (decoration; the value is the level). */
export const WATER_RAMP = [
  { at: 0, colour: "rgb(60 48 38)" },
  { at: 1, colour: "rgb(127 178 255)" },
];
export const WASD: Record<string, [number, number]> = { w: [1, 0], s: [-1, 0], a: [0, -1], d: [0, 1], ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
export const cmText = (v: number | null, lang: Lang) => (v === null ? "—" : formatSigned(v, lang, 2));
export const riverName = (tt: TT, name: string) => (name in RIVER_TEXT ? tt(RIVER_TEXT[name as DeltaRiverName]) : name);
export const degText = (v: number, lang: Lang) => formatFixed(v, lang, 1).replace(/[.,]0$/, "");
/** Semitones between two values on the water voice's rule (12 · log2 of the frequency ratio). */
export function semitones(a: number, b: number): number | null {
  const fa = mapVoice("water", a);
  const fb = mapVoice("water", b);
  return fa && fb ? 12 * Math.log2(fb / fa) : null;
}
