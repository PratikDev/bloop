// PURE: alt text for an exported tactile disc (accessibility core, step 7; spec Part 3.6). STL has no metadata fields
// (no IPTC "Alt Text (Accessibility)" or "Extended Description"), so the alt text goes in a sidecar .txt saved beside
// it and, cut to ASCII, in the 80-byte header binary STL leaves free. Every number is a slot from the disc's own data.
import { formatAxis, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import { extremeIndex } from "@/lib/timed-text/sweep";

export interface TactileAltInput {
  label: string;
  /** Disc diameter and ring heights, in millimetres. */
  sizeMm: number;
  ridgeMm: { min: number; max: number };
  range: { min: number; max: number };
  unit: string;
  /** What each step around the circle is (a year, a month), oldest first. */
  steps: readonly string[];
  /** The rings from the centre out, each with its name and values. */
  rings: readonly { name: string; values: readonly (number | null)[] }[];
}

export interface TactileAlt {
  alt: string;
  extended: string[];
}

export function tactileAlt(t: BoundT, lang: Lang, d: TactileAltInput): TactileAlt {
  const n = (v: number) => formatAxis(v, lang);
  const label = d.label.replace(/\s*\n\s*/g, ", ");
  const extremes = d.rings.flatMap((r) =>
    (["highest", "lowest"] as const).flatMap((which) => {
      const i = extremeIndex(r.values, which === "lowest");
      return i === -1 ? [] : [t("alt.tactileExtreme", { which: t(which === "highest" ? "alt.highest" : "alt.lowest"), ring: r.name, step: d.steps[i], value: n(r.values[i] as number), unit: d.unit })];
    }),
  );
  return {
    alt: t("alt.tactile", { label, size: formatInteger(d.sizeMm, lang) }),
    extended: [
      d.rings.length === 1 ? t("alt.tactileOne") : t("alt.tactileMany", { n: formatInteger(d.rings.length, lang), names: d.rings.map((r) => r.name).join(", ") }),
      t("alt.tactileSpan", { first: d.steps[0], last: d.steps[d.steps.length - 1] }),
      t("alt.tactileHeight", { min: n(d.range.min), max: n(d.range.max), unit: d.unit, low: n(d.ridgeMm.min), high: n(d.ridgeMm.max) }),
      t("alt.tactileTicks"),
      ...extremes,
    ],
  };
}

/** The sidecar .txt: the alt text, then the extended description. */
export const sidecarText = (t: BoundT, a: TactileAlt) => `${t("alt.heading.alt")}\n${a.alt}\n\n${t("alt.heading.extended")}\n${a.extended.join("\n")}\n`;

export const STL_HEADER_BYTES = 80;
const PRINTABLE_ASCII = /[^\x20-\x7e]/g;

/** The STL header: the alt text in printable ASCII, never starting "solid" (readers would take the file for ASCII STL). */
export function stlHeader(alt: string): Uint8Array {
  const text = `Bloop: ${alt}`.replace(PRINTABLE_ASCII, "?").slice(0, STL_HEADER_BYTES);
  const bytes = new Uint8Array(STL_HEADER_BYTES).fill(0x20);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}
