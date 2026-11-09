// English strings for the accessibility core, step 4: "View as table" (the values around the needle, from the grid the
// sound plays) and Places (search and the region tree: continent → country → division).
import { formatDegrees, formatUtc } from "../format";

export const placesTableEn = {
  "panel.table": "Table",
  "table.caption": (p: { record: string; unit: string; timeUtc: string; step: string }) =>
    `${p.record} around the needle, in ${p.unit}, ${formatUtc(p.timeUtc, "en")} UTC. Rows are latitudes and columns longitudes, ${p.step} degrees apart; the needle is the middle cell.`,
  "table.corner": "Latitude by longitude",
  "table.lat": (p: { lat: number }) => `${formatDegrees(p.lat, "en")}° ${p.lat >= 0 ? "N" : "S"}`,
  "table.lon": (p: { lon: number }) => `${formatDegrees(p.lon, "en")}° ${p.lon >= 0 ? "E" : "W"}`,
  "table.needle": "needle",
  "table.dry": "dry",
  "table.none": "no data",
  "table.unit.celsius": "degrees Celsius",
  "table.unit.mmPerHour": "millimetres an hour",
  "table.loading": "Loading the values.",

  "places.open": "Find a place or browse continents, countries and divisions",
  "places.short": "Places",
  "places.title": "Places",
  "places.search": "Search places",
  "places.searchHint": "A city, country, district or sea, in English or Bangla.",
  "places.none": "No place found.",
  "places.loading": "Loading places.",
  "places.error": "Places could not load. Go to by coordinates still works.",
  "places.browse": "Browse by region",
  "places.goTo": (p: { name: string }) => `Go to ${p.name}`,
  "places.moved": (p: { name: string }) => `${p.name}.`,

  "continent.asia": "Asia",
  "continent.africa": "Africa",
  "continent.europe": "Europe",
  "continent.northAmerica": "North America",
  "continent.southAmerica": "South America",
  "continent.oceania": "Oceania",
  "continent.antarctica": "Antarctica",
  "continent.sevenSeas": "Islands in the open ocean",
};
