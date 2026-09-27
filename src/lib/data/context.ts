// Long-term context files (Then vs Now, Place History). Loaded only when a
// view needs them, and checked against the contract shapes on the way in.

import type { DhakaThenNowDemo, GistempContextFile, GraceContextFile, RainContextFile } from "@/types/data-contract";
import { fetchJson } from "./fetch";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

async function load<T>(url: string, paths: Parameters<typeof requirePaths>[2]): Promise<T> {
  const json = await fetchJson<T>(url);
  requirePaths(url, json, paths);
  return json;
}

const WINDOW = (p: string) => ({ [`${p}.years`]: "array", [`${p}.values`]: "array", [`${p}.mean`]: "number" }) as const;

export const loadDemo = () =>
  load<DhakaThenNowDemo>(DATA_PATHS.demo, {
    title: "string",
    story: "string",
    "heat.caption": "string",
    "heat.dataset": "string",
    ...WINDOW("heat.A"),
    ...WINDOW("heat.B"),
    "rain.caption": "string",
    "rain.gpcp.dataset": "string",
    ...WINDOW("rain.gpcp.A"),
    ...WINDOW("rain.gpcp.B"),
    ...WINDOW("rain.gpcc.A"),
    ...WINDOW("rain.gpcc.B"),
    "water.caption": "string",
    "water.Bangladesh": "object",
    "water.NW_India": "object",
    honesty_beat: "string",
    not_claimed: "array",
  });

export const loadGrace = () =>
  load<GraceContextFile>(DATA_PATHS.grace, {
    gap_note: "string",
    "boxes.Bangladesh.months": "array",
    "boxes.Bangladesh.cm": "array",
    "boxes.NW_India.months": "array",
    "boxes.NW_India.cm": "array",
  });

const CELLS = ["Dhaka", "Chattogram", "Rajshahi", "Sylhet"] as const;

export const loadGistemp = () =>
  load<GistempContextFile>(DATA_PATHS.gistemp, Object.fromEntries(CELLS.map((c) => [`cells.${c}.anom_C`, "array"])));

export const loadGpcp = () =>
  load<RainContextFile>(DATA_PATHS.gpcp, Object.fromEntries(CELLS.map((c) => [`cells.${c}.mm_per_day`, "array"])));
