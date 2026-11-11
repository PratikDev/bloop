import { brailleNumber, frontLoad } from "@/a11y/brailleText";
import type { ChordGate, ChordTone } from "@/lib/audio/layers/types";
import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { brailleValue, sigDecimals } from "./read-short";

const pct = (f: number) => 100 * f;

export function chordText(t: BoundT, lang: Lang, gate: ChordGate, tones: readonly ChordTone[], unit: string, brief: boolean): string {
  if (!gate.allowed || !tones.length) return t(`cv.chord.block.${gate.block ?? "off"}`);
  const u = gate.trust === "relative" ? "" : unit;
  const v = (x: number) => (u ? `${formatFixed(x, lang, sigDecimals(x))} ${u}` : formatFixed(x, lang, sigDecimals(x)));
  const rel = gate.trust === "relative" ? ` (${t("cv.chord.relative")})` : "";
  if (brief) return tones.length === 1 ? t("cv.chord.briefOne") : t("cv.chord.brief", { count: formatInteger(tones.length, lang) });
  if (tones.length === 1) return t("cv.chord.one", { a: v(tones[0].value) }) + rel;
  const [a, b] = tones;
  return t("cv.chord.two", { a: v(a.value), pa: formatInteger(pct(a.fraction), lang), b: v(b.value), pb: formatInteger(pct(b.fraction), lang) }) + rel;
}

export function chordShort(gate: ChordGate, tones: readonly ChordTone[], unit: string): string {
  if (!gate.allowed || !tones.length) return "";
  const u = gate.trust === "relative" ? "" : unit;
  return frontLoad(["Chord", `${tones.length} grp`, ...tones.map((x) => `${brailleValue(x.value, u)} ${brailleNumber(pct(x.fraction), 0)}%`)]);
}
