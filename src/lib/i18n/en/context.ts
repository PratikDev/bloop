// English strings for Then vs Now and Place History. Numbers are always
// parameters from the JSON, never written here.

import { formatFixed, formatInteger } from "../format";

const n1 = (v: number) => formatFixed(v, "en", 1);
const n2 = (v: number) => formatFixed(v, "en", 2);

export const contextEn = {
  "thenNow.contextNote": "Context records, not EIC frames: long-term NASA and partner datasets for Bangladesh.",
  "thenNow.title": (p: { city: string }) => `${p.city} then vs now`,
  "thenNow.city": "City",
  // L1's label for cities other than Dhaka (docs/L1/DATA_HANDOFF.md §5).
  "thenNow.computed": "Computed, same method as Dhaka. Only Dhaka's records were cross-checked against independent records.",
  "thenNow.waterNational": "Water underground is one national record (the Bangladesh box), the same for every city.",
  "thenNow.crosscheckAlt":
    "Two charts for Dhaka. Top: June to September rain since the 1890s from rain gauges (GPCC), GPCP and NASA POWER; POWER reads far below the other two. Bottom: April to May daily maximum temperature from NASA POWER and a weather station; POWER runs well above the station.",
  "thenNow.powerTitle": "Why we don't use NASA POWER here",
  "thenNow.listen": "Listen",
  "thenNow.noSound": "(no sound yet)",
  "thenNow.parts": "Part",
  "thenNow.part.heat": "Heat",
  "thenNow.part.monsoon": "Monsoon rain",
  "thenNow.part.water": "Water underground",
  "thenNow.play": "Play this part",
  // Names what it plays: only these three have sound (fires and vegetation don't yet).
  "thenNow.playAll": "Play heat, rain and water",
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

  // Fires and vegetation (contract §6, §7): records shown without a voice yet.
  "thenNow.moreTitle": "More records, then vs now",
  "thenNow.part.fires": "Fires",
  "thenNow.part.vegetation": "Vegetation",
  "field.soundOctober": "No sound for this record yet: coming in October",
  "field.place": "Place",
  "field.sources": "Where these numbers come from",
  "field.rule": "Rule",
  "field.caveat": "Caveat",
  "field.credit": "Credit",
  "field.fires.region": "Region",
  "field.fires.region.CHT_Bangladesh_MarApr": "Chittagong Hill Tracts, March–April",
  "field.fires.region.Punjab_India_OctNov": "Punjab (India), October–November",
  "field.fires.unit": "fires per day",
  "field.fires.summary": (p: { place: string; thenYear: number; nowYear: number }) =>
    `Fires detected each day in ${p.place}, ${p.thenYear} and ${p.nowYear}, by the same MODIS sensors.`,
  // Plan §16 "Fires" wording, with the place and numbers from firms.json.
  "field.fires.caption": (p: { place: string; thenYear: number; thenTotal: number; nowYear: number; nowTotal: number }) =>
    `Example years, same sensor (MODIS): ${p.place}: ${formatInteger(p.thenTotal, "en")} fires (${p.thenYear}) vs ${formatInteger(p.nowTotal, "en")} (${p.nowYear}).`,
  "field.veg.point": "Place",
  "field.veg.point.Sundarbans": "Sundarbans",
  "field.veg.point.Madhupur_forest": "Madhupur forest",
  "field.veg.point.Dhaka_city_control": "Dhaka city (control)",
  "field.veg.unit": "NDVI",
  "field.veg.summary": (p: { place: string; then: string; now: string }) =>
    `Vegetation index (NDVI) at ${p.place} every 16 days, ${p.then} against ${p.now}.`,
  "field.veg.caption": (p: { place: string; then: string; thenMean: number; now: string; nowMean: number }) =>
    `${p.place}: mean NDVI ${n2(p.thenMean)} in ${p.then}, ${n2(p.nowMean)} in ${p.now} (a single 250 m pixel).`,

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

  "history.intro": "One place's monthly record. Pick a decade to hear it month by month, or drag along the chart to hear one month.",
  "history.place": "Place",
  "history.metric": "Record",
  "history.heat": "Heat",
  "history.rain": "Rain",
  "history.water": "Water",
  "history.decade": "Decade",
  "history.decadeLabel": (p: { decade: number }) => `${p.decade}s`,
  "history.play": (p: { decade: number }) => `Play the ${p.decade}s`,
  "history.unit.heat": "°C anomaly",
  "history.unit.rain": "mm/day",
  "history.unit.water": "cm",
  "history.group.bangladesh": "Bangladesh",
  "history.group.world": "World",
  "history.loadingWorld": "Loading this record for the world (a few megabytes, first time only)…",
  "history.noValue": (p: { month: string }) => `${p.month}: no measurement (silence)`,
  "history.sharedCell": (p: { places: string }) =>
    `In this dataset, this is the same grid cell as ${p.places}: one record, not separate places.`,
  "history.sharedRegion": (p: { places: string }) => `In this dataset, this is the same GRACE region as ${p.places}: one record, not separate places.`,
  "history.cell": (p: { lat: number; lon: number }) =>
    `Grid cell centred at ${n1(Math.abs(p.lat))}° ${p.lat >= 0 ? "N" : "S"}, ${n1(Math.abs(p.lon))}° ${p.lon >= 0 ? "E" : "W"}`,
  "history.neighbour": "(the nearest land cell; the place's own cell is sea)",
  "history.nationalBox": "Bangladesh national box (GRACE): one record for the whole country, the same for every city.",
  // From L1's confidence.json method: GPCP against independent rain gauges (GPCC), annual means 1981–2019.
  "history.confidence.high": "Rain confidence: high (GPCP agrees closely with independent rain gauges here)",
  "history.confidence.medium": "Rain confidence: medium (GPCP roughly agrees with independent rain gauges here)",
  "history.confidence.low": "Rain confidence: low (GPCP and independent rain gauges disagree here)",
  "history.confidence.satellite-only": "Rain confidence: satellite only (no rain gauges to check against here, for example at sea)",
  // L1's label outside Bangladesh (docs/L1/DATA_HANDOFF.md §8).
  "history.computed": "Computed from NASA GISTEMP / GPCP / GRACE with the same method as Dhaka; not separately cross-checked.",
  "history.summary": (p: { metric: string; place: string; from: string; to: string }) =>
    `${p.metric} for ${p.place}, monthly from ${p.from} to ${p.to}.`,
  "history.scrub": (p: { place: string }) => `${p.place} chart: drag along it, or use the arrow keys, to hear one month`,
  "history.monthValue": (p: { month: string; value: string; unit: string }) => `${p.month}: ${p.value} ${p.unit}`,
  "history.loading": "Loading the records…",
  "history.error": "Couldn't load the records. Reload the page to try again.",
};
