// English templates for the layered descriptions (accessibility core, step 3; src/lib/describe/). Every parameter is
// a slot: text the describer has already formatted from a computed value (a number, a time, a place). The templates
// themselves never type a digit, which the digit-provenance test checks on every rendered description.
// Written for the ear: short sentences, names instead of "it", units in words.

import { formatDegrees } from "../format";

type Where = { where: string };

export const describeEn = {
  /** A latitude as said (the slot for a band's centre). */
  "describe.lat": (p: { lat: number }) => `${formatDegrees(p.lat, "en")} degrees ${p.lat >= 0 ? "north" : "south"}`,
  "describe.ocean.what": (p: { time: string }) => `Ocean surface temperature, ${p.time} UTC.`,
  "describe.ocean.here": (p: Where & { value: string }) => `Here, ${p.where}: ${p.value} degrees Celsius.`,
  "describe.ocean.hereNone": (p: Where) => `Here, ${p.where}: no ocean data. This is land or a gap in the data.`,
  "describe.ocean.range": (p: { min: string; minWhere: string; max: string; maxWhere: string }) =>
    `Across the map, the coldest is ${p.min} degrees, near ${p.minWhere}. The warmest is ${p.max} degrees, near ${p.maxWhere}.`,
  "describe.ocean.bandEquator": "The warmest water lies in a band near the equator.",
  "describe.ocean.band": (p: { lat: string }) => `The warmest water lies in a band around ${p.lat}.`,
  "describe.ocean.toward": (p: { dir: string }) => `Around here, the water is warmer to the ${p.dir}.`,
  "describe.ocean.warmestHere": "Around here, the water is warmest right here.",
  "describe.ocean.even": "Around here, the water is about the same temperature all round.",

  "describe.rain.what": (p: { time: string }) => `Rain and snow, ${p.time} UTC.`,
  "describe.rain.dry": (p: Where) => `Here, ${p.where}: dry.`,
  "describe.rain.here": (p: Where & { value: string; frozen: boolean }) =>
    `Here, ${p.where}: ${p.value} millimetres an hour of ${p.frozen ? "snow" : "rain"}.`,
  "describe.rain.hereNone": (p: Where) => `Here, ${p.where}: no rain data.`,
  "describe.rain.max": (p: { max: string; maxWhere: string }) => `The heaviest on the map is ${p.max} millimetres an hour, near ${p.maxWhere}.`,
  "describe.rain.allDry": "The whole map is dry.",
  "describe.rain.toward": (p: { dir: string }) => `Around here, the rain is heaviest to the ${p.dir}.`,
  "describe.rain.heaviestHere": "Around here, the rain is heaviest right here.",
  "describe.rain.spread": "Around here, the rain is spread out.",
  "describe.rain.even": "Around here, it is dry all round.",
  "describe.rain.same": (p: { minutes: string }) => `The same as ${p.minutes} minutes earlier.`,
  "describe.rain.started": (p: { minutes: string }) => `It started in the last ${p.minutes} minutes.`,
  "describe.rain.stopped": (p: { minutes: string }) => `It stopped in the last ${p.minutes} minutes.`,
  "describe.rain.up": (p: { before: string; minutes: string }) => `Heavier than ${p.minutes} minutes earlier, when it was ${p.before} millimetres an hour.`,
  "describe.rain.down": (p: { before: string; minutes: string }) => `Lighter than ${p.minutes} minutes earlier, when it was ${p.before} millimetres an hour.`,

  "describe.meaning": "What this means",
  "describe.loading": "Describing the needle's place.",
  "describe.say": "Say it",
  "describe.note": "D on the map says this. The detail follows Settings → Detail.",
  "panel.describe": "Description",
  "describe.meaning.ocean":
    "Warm sea water gives heat and moisture to the air above it. That is the fuel for cyclones and for the monsoon rain over the Bay of Bengal. Where the sea is warmer than usual, storms can grow stronger.",
  "describe.meaning.rain":
    "This is rain and snow falling now, measured from space by NASA's IMERG about every half hour. Heavy rain upstream can bring floods downstream days later. Long dry spells matter for farms and drinking water.",
};
