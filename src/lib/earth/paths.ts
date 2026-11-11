// URLs of the shipped products the DATA records read (public/data/, served from /data/). The pipeline builds every one
// of them daily (docs/data-integration-status.md); this module is the app's one list of where they are.

const ROOT = "/data";

export const EARTH_PATHS = {
  fwiMeta: `${ROOT}/latest/fwi_class.json`,
  fwiGrid: `${ROOT}/latest/fwi_class.bin`,
  fwiArchiveIndex: `${ROOT}/context/fwi_archive_index.json`,
  /** An archive day's file, as fwi_archive_index.json names it ("archive/fwi/FWI_YYYYMMDD.u8.gz"). */
  dataFile: (relative: string) => `${ROOT}/${relative}`,
  firesMeta: `${ROOT}/latest/fires.json`,
  firesImage: `${ROOT}/latest/fires.webp`,
  landslideMeta: `${ROOT}/latest/landslide_class.json`,
  landslideGrid: `${ROOT}/latest/landslide_class.bin`,
  nightLights: `${ROOT}/context/nightlights.json`,
  sstAnomImage: `${ROOT}/latest/sst_anom.webp`,
  /** One record's validation file in public/data/official/ (the live_* acceptance checks). */
  liveValidation: (record: string) => `${ROOT}/official/${record}/validation.json`,
} as const;
