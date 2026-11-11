import { fetchJson } from "@/lib/data/fetch";
import { EARTH_PATHS } from "@/lib/earth/paths";
import type { OfficialCheck, OfficialValidationFile } from "@/types/data-contract";

export const LIVE_CHECK_RECORDS = ["live_sst", "live_rain", "live_sst_anom", "live_fwi_class", "live_landslide_class", "live_fires_frame"] as const;
export type LiveCheckRecord = (typeof LIVE_CHECK_RECORDS)[number];

const KEY_COUNT = 6;
const SIG = 3;

function pyG3(x: number): string {
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

function metricText(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : pyG3(v);
  return v;
}

export function keyNumbers(metrics: Record<string, unknown>): string {
  return Object.entries(metrics)
    .filter((e): e is [string, string | number | boolean | null] => e[1] === null || isPlain(e[1]))
    .slice(0, KEY_COUNT)
    .map(([k, v]) => `${k} ${v === null ? "None" : metricText(v)}`)
    .join("; ");
}

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
