// English strings for the Both-mode frame gap (mentor item 1; src/lib/frame-gap.ts). The times and the gap are
// parameters from the two manifests.

export const framesEn = {
  "frameGap.long": (p: { ocean: string; rain: string; apart: string }) => `Ocean frame: ${p.ocean} UTC · Rain frame: ${p.rain} UTC (${p.apart})`,
  "frameGap.days": (p: { n: string; count: number }) => `${p.n} ${p.count === 1 ? "day" : "days"} apart`,
  "frameGap.hours": (p: { n: string; count: number }) => `${p.n} ${p.count === 1 ? "hour" : "hours"} apart`,
  "frameGap.same": "the same hour",
  "frameGap.label": "The two frames are not from the same moment",
  "frameGap.short": (p: { which: string; n: string; unit: string }) => `${p.which} ${p.n}${p.unit} newer`,
  "frameGap.short.rain": "rain",
  "frameGap.short.ocean": "ocean",
  "frameGap.short.d": "d",
  "frameGap.short.h": "h",
  "frameGap.short.same": "same hour",
  "announce.trackBoth": (p: { gap: string }) => `Now hearing: Both. Frames ${p.gap}.`,
};
