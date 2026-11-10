// "Your lifetime" and the MIDI export (docs/statement/ART.md). Built only from data; braille rules apply.

export const lifetimeEn = {
  "lifetime.view": "Your lifetime",
  "lifetime.title": "The song of your lifetime",
  "lifetime.lead": "Pick a birth year and a city: hear that city's record from that year to the latest, one note a year. Nothing you pick is stored.",
  "lifetime.born": "Birth year",
  "lifetime.city": "City",
  "lifetime.play": "Play your lifetime",
  "lifetime.stop": "Stop",
  "lifetime.part.heat": "April to May heat",
  "lifetime.part.rain": "June to September rain",
  "lifetime.part.water": "Water stored underground (all of Bangladesh)",
  "lifetime.unit.heat": "degrees",
  "lifetime.unit.rain": "mm a day",
  "lifetime.unit.water": "cm",
  "lifetime.since": (p: { year: string; city: string }) => `Since ${p.year} in ${p.city}:`,
  "lifetime.starts": (p: { year: string }) => `from ${p.year}`,
  "lifetime.rose": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}) rose ${p.slope} ${p.unit} a decade (95% range ${p.lo} to ${p.hi}): a clear trend.`,
  "lifetime.fell": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}) fell ${p.slope} ${p.unit} a decade (95% range ${p.lo} to ${p.hi}): a clear trend.`,
  "lifetime.unclear": (p: { part: string; slope: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}): no clear trend (${p.slope} ${p.unit} a decade, 95% range ${p.lo} to ${p.hi}).`,
  "lifetime.tooFew": (p: { part: string; lo: string; hi: string; unit: string; starts: string }) =>
    `${p.part} (${p.starts}): too few years for a clear test; values from ${p.lo} to ${p.hi} ${p.unit}.`,
  "lifetime.notes": (p: { count: string }) => `${p.count} notes, one a year, four a second.`,
  "lifetime.link": "Link to this song",
  "lifetime.linkNote": "The link holds only the year and the city.",
  "lifetime.chart": (p: { part: string }) => `${p.part}, one point a year`,
  "lifetime.hwgt.subject": "your lifetime's trends",
  "lifetime.hwgt.method":
    "Each city's yearly series (the seasons Then vs Now plays) and, for every start year, the Mann-Kendall test with the Hamed-Rao correction and Sen's slope with its 95% range; a trend is called clear only if p < 0.05 and the range excludes 0. Written by pipeline/stats/lifetime_stats.py; the app only reads it.",
  "lifetime.hwgt.n": (p: { years: string }) => `${p.years} years`,
  "midi.download": "Download as MIDI",
  "midi.sheet": "Download the value sheet",
  "midi.note": (p: { range: string }) =>
    `For a human performer: exact pitches as MIDI notes plus pitch bend (range ${p.range} semitones), one note a year, with a sheet of year, value and frequency to check against.`,
};
