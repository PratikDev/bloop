// URLs of L1's published files (public/data/, served from /data/).

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
  grace: `${ROOT}/context/grace.json`,
  gistemp: `${ROOT}/context/gistemp_bd.json`,
  gpcp: `${ROOT}/context/gpcp_bd.json`,
  gpcc: `${ROOT}/context/gpcc_bd.json`,
  sequenceIndex: `${ROOT}/sequence/index.json`,
  sequenceFile: (file: string) => `${ROOT}/sequence/${file}`,
  truthImage: (name: "sst_compare" | "rain_compare" | "crosscheck") => `${ROOT}/truth/${name}.png`,
  mapping: "/mapping.json",
} as const;
