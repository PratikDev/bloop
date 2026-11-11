import type { CompareLayer, CompareResult } from "@/lib/compare";
import type { LatLon } from "@/lib/data";
import type { BoundT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";
import { BN, BN_MONTHS, BN_STATUS, bnCompose, bnLayer, bnNumber, bnTime, bnUnit } from "./brailleBangla";
import { fitLine, readingLine, type BrailleLang, type BrailleReading } from "./brailleLines";
import { abbrev, brailleNumber, brailleTime, clean, type DegreeStyle } from "./brailleText";

interface LiveValue {
  record: "ocean" | "rain";
  value: number | null;
  frozen: boolean;
  at: LatLon;
  timeUtc: string;
  note?: { en: string; bn: string };
}

const blang = (lang: Lang): BrailleLang => (lang === "bn" ? "bn" : "en");

function liveReading(t: BoundT, v: LiveValue): BrailleReading {
  const ocean = v.record === "ocean";
  return {
    short: ocean ? "SST" : "Rain",
    long: t(ocean ? "braille.name.ocean" : "braille.name.rain"),
    layer: v.record,
    kind: v.value === null ? "nodata" : !ocean && v.value === 0 ? "dry" : "value",
    value: v.value,
    decimals: ocean ? 1 : v.value !== null && v.value >= 10 ? 0 : 1,
    below: false,
    snow: v.frozen,
    unit: ocean ? "°C" : "mm/h",
    place: v.at,
    time: { iso: v.timeUtc || null, label: null },
    badge: "observation",
    status: "",
    relative: false,
    note: v.note,
  };
}

export const valueShort = (t: BoundT, lang: Lang, degree: DegreeStyle, v: LiveValue) => readingLine(t, liveReading(t, v), blang(lang), degree, false);

export function describeShort(t: BoundT, lang: Lang, degree: DegreeStyle, values: readonly LiveValue[]): string {
  const [first, ...rest] = values.map((v) => valueShort(t, lang, degree, v));
  if (!first) return "";
  const line = fitLine([first], rest);
  return lang === "bn" ? bnCompose(line) : line;
}

export function sonarShort(t: BoundT, lang: Lang, degree: DegreeStyle, v: LiveValue): string {
  const note = v.record === "ocean" ? { en: "warmest", bn: "সবচেয়ে উষ্ণ" } : { en: "wettest", bn: "সবচেয়ে বেশি বৃষ্টি" };
  return valueShort(t, lang, degree, { ...v, note });
}

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const month = (ym: string, lang: Lang) => {
  const [y, m] = ym.split("-").map(Number);
  return lang === "bn" ? `${BN_MONTHS[m - 1]} ${y}` : `${EN_MONTHS[m - 1]} ${y}`;
};
const COMPARE: Record<CompareLayer, { en: string; bn: string; unit: string; decimals: number }> = {
  heat: { en: "Heat", bn: "তাপমাত্রার বিচ্যুতি", unit: "°C", decimals: 2 },
  rain: { en: "Rain", bn: "বৃষ্টি", unit: "mm/day", decimals: 2 },
  water: { en: "Water", bn: "মোট পানির মজুত", unit: "cm", decimals: 1 },
};

export function compareShort(lang: Lang, degree: DegreeStyle, r: CompareResult): string {
  const c = COMPARE[r.layer];
  if (lang === "bn") {
    if (r.diff === null || r.a.value === null || r.b.value === null) return bnCompose(`${c.bn} ${BN.noData}`);
    const sign = r.diff < 0 ? "ঋণাত্মক " : "";
    return bnCompose(fitLine([c.bn, `${sign}${bnNumber(Math.abs(r.diff), c.decimals)} ${bnUnit(c.unit)}`, `${month(r.b.month, lang)} বনাম ${month(r.a.month, lang)}`], []));
  }
  const unit = c.unit === "°C" ? (degree === "word" ? "C" : "°C") : c.unit;
  if (r.diff === null || r.a.value === null || r.b.value === null) return clean(`${c.en} no data ${month(r.b.month, lang)} vs ${month(r.a.month, lang)}`);
  const n = (v: number) => brailleNumber(v, c.decimals);
  const diff = `${r.diff > 0 ? "+" : ""}${n(r.diff)}${unit}`;
  return fitLine([c.en, diff, `${month(r.b.month, lang)} vs ${month(r.a.month, lang)}`], [`now ${n(r.b.value)}`]);
}

export function provenanceShort(
  lang: Lang,
  record: "ocean" | "rain",
  source: { name: string; kind: "measurement" | "model" | "inventory" },
  frame: { frame_time_utc: string; grid: { width: number } },
): string {
  const deg = 360 / frame.grid.width;
  if (lang === "bn") {
    const kind = source.kind === "model" ? BN_STATUS.model : BN_STATUS.observation;
    return bnCompose(fitLine([bnLayer(record), `${bnNumber(deg, 2)} ডিগ্রি ঘর`, bnTime(frame.frame_time_utc)], [kind]));
  }
  const short = record === "ocean" ? "SST" : "Rain";
  const dataset = /^[A-Z0-9]+(?: [A-Z0-9]+)*/u.exec(source.name)?.[0] ?? clean(source.name);
  return fitLine([short, dataset, `${brailleNumber(deg, 2)}deg`, brailleTime(frame.frame_time_utc, true)], [abbrev(source.kind)]);
}
