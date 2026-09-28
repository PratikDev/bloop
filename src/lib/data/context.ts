// Long-term context files (Then vs Now, Place History). Loaded only when a
// view needs them, and checked against the contract shapes on the way in.

import type {
  CitiesThenNowFile,
  DhakaThenNowDemo,
  FirmsContextFile,
  GistempContextFile,
  GlobeDuetFile,
  GraceContextFile,
  NdviContextFile,
  NdviPointName,
  RainContextFile,
} from "@/types/data-contract";
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

/**
 * The four cities (contract §13, optional). Each city is checked like the Dhaka
 * demo; one that fails is left out rather than failing the whole view.
 */
export async function loadCities(): Promise<CitiesThenNowFile> {
  const file = await load<CitiesThenNowFile>(DATA_PATHS.cities, { note: "string", water_note: "string", cities: "array" });
  const cities = file.cities.filter((city) => {
    try {
      requirePaths(`${DATA_PATHS.cities} (${city.name})`, city, {
        name: "string",
        cross_checked: "boolean",
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
      });
      return true;
    } catch {
      return false;
    }
  });
  return { ...file, cities };
}

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

/** Fire counts (contract §6): example years, MODIS compared with MODIS only. */
export const loadFirms = () => load<FirmsContextFile>(DATA_PATHS.firms, { dataset: "string", rule: "string", credit: "string", cases: "object" });

export const NDVI_POINTS = ["Sundarbans", "Madhupur_forest", "Dhaka_city_control"] as const satisfies readonly NdviPointName[];

/** Vegetation (contract §7): three single 250 m pixels, 2001–03 vs 2021–23. */
export const loadNdvi = () =>
  load<NdviContextFile>(DATA_PATHS.ndvi, {
    dataset: "string",
    caveat: "string",
    credit: "string",
    ...Object.fromEntries(
      NDVI_POINTS.flatMap((p) =>
        (["A", "B"] as const).flatMap((w) => [
          [`points.${p}.${w}.dates`, "array"] as const,
          [`points.${p}.${w}.ndvi`, "array"] as const,
          [`points.${p}.${w}.mean`, "number"] as const,
        ]),
      ),
    ),
  });

/** Ground vs satellite cloud cover (contract §12). Shown only when status is "ok". */
export const loadGlobeDuet = () =>
  load<GlobeDuetFile>(DATA_PATHS.globeDuet, { title: "string", status: "string", disclosure: "string", credit: "string", summary: "object", pairs: "array" });

export const loadGpcp = () =>
  load<RainContextFile>(DATA_PATHS.gpcp, Object.fromEntries(CELLS.map((c) => [`cells.${c}.mm_per_day`, "array"])));
