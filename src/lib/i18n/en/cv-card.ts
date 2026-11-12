// English strings for the "Same chord, whatever the colours" card on How we know (CV/ML build, piece C). Numbers are
// slots from public/data/meta/colormap_invariance.json.
export const cvCardEn = {
  "cv.card.title": "Same chord, whatever the colours",
  "cv.card.value": (p: { spread: string }) => `${p.spread} °C`,
  "cv.card.figure": (p: { sigma: string }) => `the most the middle value moved between three colour maps (our measured error: ${p.sigma} °C)`,
  "cv.card.numbers": (p: { median: string; mode: string; sigma: string }) =>
    `Median moved at most ${p.median} °C, a group's value at most ${p.mode} °C, between colour maps; our error is ${p.sigma} °C.`,
  "cv.card.explain":
    "The same sea temperatures drawn three ways (NASA's bar, viridis and jet) give the same chord, because Bloop reads values, not colours. A chord built from hues would change with the colours.",
  "cv.card.limit": "Tested on synthetic renders of NASA MUR data; real frames add compression and line effects.",
  "cv.card.alt": (p: { region: string; date: string }) =>
    `${p.region}, ${p.date}: three renders of the same MUR sea temperatures (NASA's colour bar, viridis, jet), and under each the values Bloop recovered drawn over the true distribution. The three recovered curves match the truth and each other.`,
  "cv.card.col.region": "Region and date",
  "cv.card.col.map": "Colour map",
  "cv.card.col.median": "Median, °C",
  "cv.card.col.modes": "Groups, °C",
  "cv.card.col.hue": "Hue difference from NASA's bar (0 same, 2 none shared)",
  "cv.card.truth": "MUR truth",
  "cv.card.open": "See both regions",
  "cv.card.hwgt.method":
    "Real NASA MUR sea temperatures in two boxes were drawn with three colour maps over the same range, and each picture was read back with the pipeline's own inverter against its own bar. Median and value groups (smoothed by the measured error, at most 2) were compared; so were the colours' hue histograms.",
  "cv.card.hwgt.unc": (p: { sigma: string; jpeg: string }) =>
    `Agreement is judged against our measured error, ${p.sigma} °C. With JPEG compression, jet's dark low end moved the 10th percentile by up to ${p.jpeg} °C (reported, not hidden).`,
};
