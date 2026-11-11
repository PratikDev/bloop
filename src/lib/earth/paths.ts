const ROOT = "/data";

export const EARTH_PATHS = {
  fwiMeta: `${ROOT}/latest/fwi_class.json`,
  fwiGrid: `${ROOT}/latest/fwi_class.bin`,
  fwiArchiveIndex: `${ROOT}/context/fwi_archive_index.json`,
  dataFile: (relative: string) => `${ROOT}/${relative}`,
  firesMeta: `${ROOT}/latest/fires.json`,
  firesImage: `${ROOT}/latest/fires.webp`,
  landslideMeta: `${ROOT}/latest/landslide_class.json`,
  landslideGrid: `${ROOT}/latest/landslide_class.bin`,
  nightLights: `${ROOT}/context/nightlights.json`,
  sstAnomImage: `${ROOT}/latest/sst_anom.webp`,
  liveValidation: (record: string) => `${ROOT}/official/${record}/validation.json`,
} as const;
