// English strings for the value chord (CV/ML build, piece B; src/lib/audio/layers/chord). Every value and share is a
// slot filled from the box's groups, never typed here.
export const cvChordEn = {
  "cv.chord.toggle": "Chord: spread of values",
  "cv.chord.two": (p: { a: string; pa: string; b: string; pb: string }) => `Two groups: ${p.a} (${p.pa} %) and ${p.b} (${p.pb} %)`,
  "cv.chord.one": (p: { a: string }) => `One group around ${p.a}`,
  "cv.chord.brief": (p: { count: string }) => `Chord: ${p.count} groups`,
  "cv.chord.briefOne": "Chord: 1 group",
  "cv.chord.relative": "relative values",
  "cv.chord.modesOnly": "This colour bar is dark at its low end, so the chord gives the groups only, not the lowest values.",
  "cv.chord.block.pattern-only": "Chord off: this record is pattern only, so no values were read.",
  "cv.chord.block.not-allowlisted": "Chord off: this record's colour bar or error doesn't allow it.",
  "cv.chord.block.both": "Chord off: Both already plays two data voices.",
  "cv.chord.block.duet": "Chord off: the proof-in-unison duet already plays two data voices.",
  "cv.chord.block.no-data": "Chord off: no values in this box.",
  "cv.chord.block.off": "Chord is off.",
  "cv.chord.atMeasure": "Chord on, but the Science to Art dial is at Measure (plain tones): it plays at Blend and Music.",
  "cv.hwgt.chord.subject": "The chord",
  "cv.hwgt.chord.method":
    "The values come from inverting NASA's colour bar (the same values the panel reads). Their histogram is smoothed with a Gaussian as wide as the record's measured error, and at most 2 groups are kept (each at least 5 % of the box). Each group plays at its value through the same value-to-pitch rule as the melody, louder for a bigger share, under the melody.",
  "cv.hwgt.chord.unc": (p: { sigma: string }) => `Smoothing width: the measured error, ${p.sigma}. Groups closer than that merge.`,
};
