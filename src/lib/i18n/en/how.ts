// English strings for the How we know cards' evidence (mentor item 6). Every number is a parameter from sst.json /
// rain.json `verified` (the rows of docs/official/VALIDATION_TABLE.md), the pair files, truth/stats.json or
// globe_duet.json.

export const howEn = {
  "how.notAvailable": "not available",
  "how.viewTable": "View as table",
  "how.hideTable": "Hide table",
  "how.oneToOne": "1:1 line: perfect agreement",
  "how.col.lat": "Latitude",
  "how.col.lon": "Longitude",
  "how.col.date": "Date",
  "how.col.frameC": "Read from the frame (°C)",
  "how.col.murC": "MUR file (°C)",
  "how.col.frameMmh": "Read from the frame (mm/h)",
  "how.col.imergMmh": "IMERG file (mm/h)",
  "how.col.groundPct": "Ground observer (% cloud)",
  "how.col.satellitePct": "Satellite (% cloud)",
  "how.col.sound": "Sound",
  "how.col.rule": "Rule",
  "how.ocean.numbers": (p: { median: string; p90: string; n: string; rho: string; date: string; source: string }) =>
    `Median error ${p.median} °C; 90% of points within ${p.p90} °C; n = ${p.n}. Newest frame checked ${p.date}: ρ = ${p.rho} against ${p.source}.`,
  "how.ocean.explain": (p: { n: string }) =>
    `We read the ocean temperature back from the colours of the EIC frame at ${p.n} places and compared each with NASA's MUR file at the same place. The dots sit on the 1:1 line: the values we play are the ones in NASA's data, give or take a fraction of a degree.`,
  "how.ocean.alt": (p: { n: string; rho: string; median: string }) =>
    `Scatter plot of ${p.n} points: ocean temperature read from the frame against NASA's MUR file. They lie close to the 1:1 line (ρ = ${p.rho}, median error ${p.median} °C).`,
  "how.rain.numbers": (p: { percent: string; n: string; agree: string; rho: string; date: string; source: string }) =>
    `Typical difference ~${p.percent}%; rain or no rain agreed at ${p.agree}% of points; n = ${p.n}. Newest frame checked ${p.date}: ρ = ${p.rho} against ${p.source}.`,
  "how.rain.explain":
    "We read the rain rate back from the frame's colours where both the frame and NASA's IMERG file have rain, and compared them at the same place and half-hour. The colours have steps, so the values differ a little, but heavier rain in the file is heavier rain in what you hear.",
  "how.rain.alt": (p: { n: string; rho: string }) =>
    `Scatter plot, log scales, of ${p.n} rainy points: rain rate read from the frame against NASA's IMERG file. They follow the 1:1 line (ρ = ${p.rho}).`,
  "how.rules.numbers": (p: { count: string }) => `${p.count} sounds, each with one written rule; the full list is one click away.`,
  "how.rules.explain":
    "Every sound follows a rule written down before we listened: which number drives it and what changes. A missing value is silence, never a guess.",
  "how.globe.numbers": (p: { median: string; within: string; rho: string; n: string; source: string }) =>
    `Median difference ${p.median} points; ${p.within}% of place-days within 25 points; ρ = ${p.rho}; n = ${p.n} place-days (${p.source}).`,
  "how.globe.explain":
    "Volunteers in Bangladesh reported how cloudy the sky looked; a weather satellite measured cloud cover over the same place and day. They often differ, because one looks up from a spot and the other down over a wider area: two perspectives, not right vs wrong.",
  "how.globe.alt": (p: { n: string; rho: string }) =>
    `Scatter plot of ${p.n} place-days: cloud cover a ground observer reported against the satellite's. The dots spread widely around the 1:1 line (ρ = ${p.rho}).`,
  "badge.skipped": "Skipped in this version",
};
