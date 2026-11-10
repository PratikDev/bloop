// The live frames' acceptance checks (public/data/official/live_*/validation.json), read directly by the live
// provenance cards so their numbers come from the files, not only from a link into docs/official/VALIDATION_TABLE.md.
// keyNumbers() writes a check's numbers exactly as pipeline/svs/validate.py's _fmt does for that table (the first six
// plain metrics, floats to three significant figures), so a test can hold the two equal.

import { fetchJson } from "@/lib/data/fetch";
import { EARTH_PATHS } from "@/lib/earth/paths";
import type { OfficialCheck, OfficialValidationFile } from "@/types/data-contract";

/** The six live products' validation records (public/data/official/live_<product>/). */
export const LIVE_CHECK_RECORDS = ["live_sst", "live_rain", "live_sst_anom", "live_fwi_class", "live_landslide_class", "live_fires_frame"] as const;
export type LiveCheckRecord = (typeof LIVE_CHECK_RECORDS)[number];

const KEY_COUNT = 6;
const SIG = 3;

/** Python's "{:.3g}" for one float (validate.py): three significant figures, no trailing zeros, e-notation outside 1e-4…1e3. */
export function pyG3(x: number): string {
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(Number(x.toPrecision(SIG)))));
  if (exp < -4 || exp >= SIG) {
    const [m, e] = x.toExponential(SIG - 1).split("e");
    const mant = m.includes(".") ? m.replace(/0+$/u, "").replace(/\.$/u, "") : m;
    const n = Number(e);
    return `${mant}e${n < 0 ? "-" : "+"}${String(Math.abs(n)).padStart(2, "0")}`;
  }
  return String(Number(x.toPrecision(SIG)));
}

const isPlain = (v: unknown): v is string | number | boolean => typeof v === "string" || typeof v === "number" || typeof v === "boolean";

/** A metric's text as Python prints it (True/False, floats with .3g, the rest as they are). */
function metricText(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : pyG3(v);
  return v;
}

/** "test C5315; status PASS; decoded_share 0.93": the table's "Key numbers" cell for a check's metrics. */
export function keyNumbers(metrics: Record<string, unknown>): string {
  return Object.entries(metrics)
    .filter((e): e is [string, string | number | boolean | null] => e[1] === null || isPlain(e[1]))
    .slice(0, KEY_COUNT)
    .map(([k, v]) => `${k} ${v === null ? "None" : metricText(v)}`)
    .join("; ");
}

/** The table's "Result" cell: PASS, MISS or no threshold. */
export const checkResult = (c: Pick<OfficialCheck, "pass">): "PASS" | "MISS" | "no threshold" => (c.pass === null ? "no threshold" : c.pass ? "PASS" : "MISS");

const cache = new Map<LiveCheckRecord, Promise<OfficialValidationFile>>();

export function loadLiveCheck(record: LiveCheckRecord): Promise<OfficialValidationFile> {
  let p = cache.get(record);
  if (!p) {
    p = fetchJson<OfficialValidationFile>(EARTH_PATHS.liveValidation(record));
    p.catch(() => cache.delete(record));
    cache.set(record, p);
  }
  return p;
}
