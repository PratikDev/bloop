import type { ProvenanceLink } from "./types";

const REPO = "https://github.com/PratikDev/bloop/blob/main/";

export const repoLink = (path: string, label = path): ProvenanceLink => ({ label, href: `${REPO}${path}` });

export const VALIDATION_TABLE = "docs/official/VALIDATION_TABLE.md";
export const TRUTH_STATS = "public/data/truth/stats.json";

export const rowLink = (file: string, row: string): ProvenanceLink => ({ label: `${file.split("/").pop()}: ${row}`, href: `${REPO}${file}` });

export const SCRIPTS = {
  sst: ["pipeline/convert_sst.py", "pipeline/verify_latest.py"],
  rain: ["pipeline/convert_rain.py", "pipeline/verify_latest.py"],
  gap: ["src/lib/frame-gap.ts"],
  heat: ["pipeline/build_context.py", "pipeline/build_demo.py", "pipeline/build_cities.py", "pipeline/stats/then_vs_now_stats.py"],
  water: ["pipeline/build_context.py", "pipeline/stats/then_vs_now_stats.py"],
  pairs: ["pipeline/verify_latest.py", "pipeline/stats/truth_stats.py"],
  rules: ["public/mapping.json", "src/lib/audio/mapping-text.ts"],
  globe: ["pipeline/build_globe_duet.py", "pipeline/stats/truth_stats.py"],
  monthly: ["pipeline/build_context.py"],
  world: ["pipeline/build_global.py"],
  official: ["pipeline/svs/export.py"],
  related: ["pipeline/svs/onboard/__main__.py", "pipeline/svs/export.py"],
} as const;
