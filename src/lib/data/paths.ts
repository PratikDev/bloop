// URLs of L1's published files (public/data/, served from /data/).

import type { GlobalLayerName } from "@/types/data-contract";

const ROOT = "/data";

export const DATA_PATHS = {
  sstMeta: `${ROOT}/latest/sst.json`,
  sstGrid: `${ROOT}/latest/sst.bin`,
  sstImage: `${ROOT}/latest/sst.webp`,
  rainMeta: `${ROOT}/latest/rain.json`,
  rainGrid: `${ROOT}/latest/rain.bin`,
  rainImage: `${ROOT}/latest/rain.png`,
  rainPhaseGrid: (phaseFile: string) => `${ROOT}/latest/${phaseFile}`,
  demo: `${ROOT}/demo/dhaka_then_now.json`,
  cities: `${ROOT}/demo/cities_then_now.json`,
  thenNowStats: `${ROOT}/thenvsnow/stats.json`,
  truthStats: `${ROOT}/truth/stats.json`,
  grace: `${ROOT}/context/grace.json`,
  gistemp: `${ROOT}/context/gistemp_bd.json`,
  gpcp: `${ROOT}/context/gpcp_bd.json`,
  firms: `${ROOT}/context/firms.json`,
  ndvi: `${ROOT}/context/ndvi.json`,
  globeDuet: `${ROOT}/context/globe_duet.json`,
  ensemble: `${ROOT}/context/ensemble_bd.json`,
  official: (file: string) => `${ROOT}/official/${file}`,
  related: (file: string) => `${ROOT}/related/${file}`,
  sequenceIndex: `${ROOT}/sequence/index.json`,
  sequenceFile: (file: string) => `${ROOT}/sequence/${file}`,
  truthImage: (name: "sst_compare" | "rain_compare" | "crosscheck") => `${ROOT}/truth/${name}.png`,
  globalPlaces: `${ROOT}/global/places.json`,
  globalManifest: `${ROOT}/global/manifest.json`,
  globalConfidence: `${ROOT}/global/confidence.json`,
  globalLayer: (layer: GlobalLayerName) => `${ROOT}/global/${layer}.json`,
  globalFile: (file: string) => `${ROOT}/global/${file}`,
  mapping: "/mapping.json",
  // §15 (docs/data-integration-plan.md)
  freshness: `${ROOT}/meta/freshness.json`,
  sstAnomMeta: `${ROOT}/latest/sst_anom.json`,
  sstAnomGrid: `${ROOT}/latest/sst_anom.bin`,
  sstAnomImage: `${ROOT}/latest/sst_anom.webp`,
  sstDtMeta: `${ROOT}/latest/sst_dt.json`,
  sstDtGrid: `${ROOT}/latest/sst_dt.bin`,
  truthPairs: (product: "sst" | "rain") => `${ROOT}/truth/${product}_pairs.json`,
  threeway: `${ROOT}/truth/threeway.json`,
} as const;
