// Layered descriptions: fill-in-the-blank templates (src/lib/i18n/*/
// describe.ts) with slots bound to computed facts (facts.ts). Brief: what, where, when, units and the range. Standard:
// + the pattern by rule and the change since the previous frame. Detailed: + a human-written "What this means" block,
// kept apart from the data text. No number is ever typed into a template; the digit-provenance test renders every
// branch with marked slots and fails on any digit outside one.
import { REGION_LABEL } from "@/a11y/mapNav";
import { bindT, type BoundT, type Lang } from "@/lib/i18n";
import { formatInteger, formatRainRate, formatTemperature, formatUtc } from "@/lib/i18n/format";
import type { Verbosity } from "@/components/AppState/access";
import { EQUATOR_DEG } from "./stats";
import type { RecordFacts, Spot } from "./facts";

/** Marks around a slot in audit mode (private-use characters: never in real text). */
const SLOT_OPEN = "";
const SLOT_CLOSE = "";

/** Formats computed values for the templates; every digit in a description comes from one of these. */
export interface Slots {
  temp(c: number): string;
  rain(mmPerHour: number): string;
  minutes(n: number): string;
  time(iso: string): string;
  lat(lat: number): string;
  where(at: Spot): string;
}

function makeSlots(t: BoundT, lang: Lang, audit = false): Slots {
  const slot = (text: string) => (audit ? `${SLOT_OPEN}${text}${SLOT_CLOSE}` : text);
  return {
    temp: (c) => slot(formatTemperature(c, lang)),
    rain: (mm) => slot(formatRainRate(mm, lang)),
    minutes: (n) => slot(formatInteger(n, lang)),
    time: (iso) => slot(formatUtc(iso, lang)),
    lat: (lat) => slot(t("describe.lat", { lat })),
    // A gazetteer line ("Bay of Bengal, 140 kilometres south of Khulna") when there is one, else the coordinates.
    where: (at) => slot(at.place ?? t("place.spoken", at)),
  };
}

export interface Description {
  /** The data text, sentence by sentence (what the status region or Bloop's voice says). */
  data: string[];
  /** Detailed only: the human-written "What this means" block, never mixed into the data text. */
  meaning: string | null;
}

/** A record's sentences by place, in the order the sweep plays (spec 3.2: the description walks the image as the sound
 *  does): what and when, the needle, the nine cells around it, then the whole map. */
interface Parts {
  what: string;
  here: string;
  around: string[]; // standard and detailed only
  map: string[];
  mapPattern: string[]; // standard and detailed only
}

/** One record's description at the chosen detail. `audit` marks every slot (for the digit-provenance test). */
export function describeRecord(f: RecordFacts, verbosity: Verbosity, lang: Lang, audit = false): Description {
  const t = bindT(lang);
  const s = makeSlots(t, lang, audit);
  const p = f.record === "ocean" ? oceanParts(f, t, s) : rainParts(f, t, s);
  const full = verbosity !== "brief";
  const data = [p.what, p.here, ...(full ? p.around : []), ...p.map, ...(full ? p.mapPattern : [])];
  const meaning = verbosity === "detailed" ? t(f.record === "ocean" ? "describe.meaning.ocean" : "describe.meaning.rain") : null;
  return { data, meaning };
}

/** The text said for a description: the data, then (detailed) "What this means:" and its block. */
export function spokenDescription(d: Description, t: BoundT): string {
  return [...d.data, ...(d.meaning ? [`${t("describe.meaning")}: ${d.meaning}`] : [])].join(" ");
}

function oceanParts(f: RecordFacts, t: BoundT, s: Slots): Parts {
  const where = s.where(f.here);
  const local = f.local;
  const around =
    local.kind === "even"
      ? [t("describe.ocean.even")]
      : local.kind === "toward"
        ? [local.region === "centre" ? t("describe.ocean.warmestHere") : t("describe.ocean.toward", { dir: t(REGION_LABEL[local.region]) })]
        : [];
  return {
    what: t("describe.ocean.what", { time: s.time(f.timeUtc) }),
    here: f.value === null ? t("describe.ocean.hereNone", { where }) : t("describe.ocean.here", { where, value: s.temp(f.value) }),
    around,
    map:
      f.min && f.max
        ? [t("describe.ocean.range", { min: s.temp(f.min.value), minWhere: s.where(f.min), max: s.temp(f.max.value), maxWhere: s.where(f.max) })]
        : [],
    mapPattern:
      f.band === null ? [] : [Math.abs(f.band) <= EQUATOR_DEG ? t("describe.ocean.bandEquator") : t("describe.ocean.band", { lat: s.lat(f.band) })],
  };
}

function rainParts(f: RecordFacts, t: BoundT, s: Slots): Parts {
  const where = s.where(f.here);
  const local = f.local;
  const pattern =
    local.kind === "even"
      ? t("describe.rain.even")
      : local.kind === "spread"
        ? t("describe.rain.spread")
        : local.kind === "toward"
          ? local.region === "centre"
            ? t("describe.rain.heaviestHere")
            : t("describe.rain.toward", { dir: t(REGION_LABEL[local.region]) })
          : null;
  const change = rainChange(f, t, s);
  const here =
    f.value === null
      ? t("describe.rain.hereNone", { where })
      : f.value === 0
        ? t("describe.rain.dry", { where })
        : t("describe.rain.here", { where, value: s.rain(f.value), frozen: f.frozen });
  const map = f.max ? t("describe.rain.max", { max: s.rain(f.max.value), maxWhere: s.where(f.max) }) : f.value !== null ? t("describe.rain.allDry") : null;
  return {
    what: t("describe.rain.what", { time: s.time(f.timeUtc) }),
    here,
    // The change belongs to the needle: said with it, right after the pattern around it.
    around: [...(pattern ? [pattern] : []), ...(change ? [change] : [])],
    map: map ? [map] : [],
    mapPattern: [],
  };
}

/** Compared as said: two values that read the same are the same. */
function rainChange(f: RecordFacts, t: BoundT, s: Slots): string | null {
  if (!f.change || f.value === null) return null;
  const minutes = s.minutes(f.change.minutes);
  // Both from the same grid (the time-lapse's), so they compare; "before" is the one said.
  const { before, after: now } = f.change;
  if (before === 0 && now === 0) return t("describe.rain.same", { minutes });
  if (before === 0) return t("describe.rain.started", { minutes });
  if (now === 0) return t("describe.rain.stopped", { minutes });
  const plain = makeSlots(t, "en");
  if (plain.rain(before) === plain.rain(now)) return t("describe.rain.same", { minutes });
  return t(now > before ? "describe.rain.up" : "describe.rain.down", { before: s.rain(before), minutes });
}

