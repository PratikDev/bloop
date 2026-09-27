// English strings for Then vs Now and Place History. Numbers are always
// parameters from the JSON, never written here.

import { formatFixed, formatInteger } from "../format";

const n1 = (v: number) => formatFixed(v, "en", 1);
const n2 = (v: number) => formatFixed(v, "en", 2);

export const contextEn = {
  "thenNow.contextNote": "Context records, not EIC frames: long-term NASA and partner datasets for Bangladesh.",
  "thenNow.parts": "Part",
  "thenNow.part.heat": "Heat",
  "thenNow.part.monsoon": "Monsoon rain",
  "thenNow.part.water": "Water underground",
  "thenNow.play": "Play this part",
  "thenNow.playAll": "Play all three",
  "thenNow.split": "Then left, now right",
  "thenNow.stop": "Stop",
  "thenNow.soundOff": "Sound is off. Turn sound on to hear this comparison.",
  "thenNow.loading": "Loading the comparison…",
  "thenNow.error": "Couldn't load the comparison data. Reload the page to try again.",
  "thenNow.then": (p: { label: string }) => `Then, ${p.label}`,
  "thenNow.now": (p: { label: string }) => `Now, ${p.label}`,
  "thenNow.unit.anomaly": "°C anomaly",
  "thenNow.unit.mmPerDay": "mm/day",
  "thenNow.unit.cm": "cm",
  "thenNow.summary.yearly": (p: { part: string; unit: string; thenLabel: string; thenMean: number; nowLabel: string; nowMean: number }) =>
    `${p.part}: mean ${n2(p.thenMean)} ${p.unit} in ${p.thenLabel}, mean ${n2(p.nowMean)} ${p.unit} in ${p.nowLabel}.`,
  "thenNow.water.played": "Bangladesh (you hear this)",
  "thenNow.water.notPlayed": "NW India (shown for comparison, not played)",
  "thenNow.water.shading": "Shaded: the two comparison windows, and months with no satellite measurements.",
  "thenNow.water.summary": (p: { missing: number; from: string; to: string }) =>
    `Water storage in Bangladesh, monthly from ${p.from} to ${p.to}; ${formatInteger(p.missing, "en")} months have no measurement.`,

  "disclosure.title": "How this comparison is made",
  "disclosure.dataset": "Dataset",
  "disclosure.window": (p: { label: string; years: number }) => `${p.label} (${formatInteger(p.years, "en")} years)`,
  "disclosure.mean": (p: { value: number; unit: string }) => `mean ${n2(p.value)} ${p.unit}`,
  "disclosure.spread": (p: { value: number; unit: string }) => `year-to-year spread ${n2(p.value)} ${p.unit}`,
  "disclosure.change": (p: { value: string }) => `Change: ${p.value}`,
  "disclosure.crossCheck": "Cross-check, rain gauges (GPCC, not played)",
  "disclosure.box": (p: { name: string; a: number; b: number; windowA: string; windowB: string; trend: number }) =>
    `${p.name}: ${n2(p.a)} cm (${p.windowA}) → ${n2(p.b)} cm (${p.windowB}); trend ${n2(p.trend)} cm per year`,
  "disclosure.gapNote": "Gap",
  "disclosure.notClaimed": "What we don't claim",
  "disclosure.pending": "Caption shown exactly as the data file gives it, until the team approves final wording.",

  "history.intro": "One place's monthly record. Pick a decade to hear it month by month.",
  "history.place": "Place",
  "history.metric": "Record",
  "history.heat": "Heat",
  "history.rain": "Rain",
  "history.decade": "Decade",
  "history.decadeLabel": (p: { decade: number }) => `${p.decade}s`,
  "history.play": (p: { decade: number }) => `Play the ${p.decade}s`,
  "history.unit.heat": "°C anomaly",
  "history.unit.rain": "mm/day",
  "history.sharedCell": (p: { places: string }) =>
    `In this dataset, this is the same grid cell as ${p.places}: one record, not separate places.`,
  "history.cell": (p: { lat: number; lon: number }) => `Grid cell centred at ${n1(p.lat)}° N, ${n1(p.lon)}° E`,
  "history.summary": (p: { metric: string; place: string; from: string; to: string }) =>
    `${p.metric} for ${p.place}, monthly from ${p.from} to ${p.to}.`,
  "history.loading": "Loading the records…",
  "history.error": "Couldn't load the records. Reload the page to try again.",
};
