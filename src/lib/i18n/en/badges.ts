// English strings for the source and data-age badges on every voice and record (book §13.2:
// "Model estimate", "Latest available: [age]"). Bangla drafts: components/SourceBadges/strings-bn.ts.

import { formatFixed, formatInteger } from "../format";

export const badgesEn = {
  "badge.sources": "Sources",
  "badge.model": "Model estimate",
  "badge.measurement": "Measurement",
  "badge.framePaired": "Frame-paired",
  "badge.context": "Context",
  "badge.agency.ground": "Ground",
  "badge.agency.other": "Other agency",
  "badge.partly": "Partly independent: shares inputs",
  "badge.latest": (p: { age: string }) => `Latest available: ${p.age}`,
  "badge.hours": (p: { n: number }) => `${formatInteger(p.n, "en")} h old`,
  "badge.days": (p: { n: number }) => `${formatFixed(p.n, "en", 1)} days old`,
  "badge.recorded": (p: { age: string }) => `Recorded (${p.age}): older than its freshness limit`,
  "badge.baseline": (p: { from: string; to: string }) => `Record ${p.from} to ${p.to}`,
  "badge.missing": "Not published yet",
};
