// English strings for the page shell (redesign, docs/L3/REDESIGN.md): the
// navigation, Home, the Listen page's hint and tour, the Then vs Now views,
// How we know, and "no signal". Numbers are parameters from the data files.

import { formatFixed, formatInteger } from "../format";

export const pagesEn = {
  "app.skipToContent": "Skip to content",

  "nav.label": "Pages",
  "nav.home": "Earth Information Jukebox, home",
  "nav.listen": "Listen",
  "nav.thenNow": "Then vs Now",
  "nav.how": "How we know",
  "nav.howShort": "How",

  "home.eyebrow": "NASA Earth Information Center · today's frames",
  "home.titleLead": "Listen to",
  "home.titleAccent": "today's Earth.",
  "home.continue": "Continue listening",
  "home.stations": "Three ways in",
  "home.station.listen": "Move across today's NASA frame and hear the ocean and rain under the cursor.",
  "home.station.thenNow": "Hear how heat, monsoon rain and water underground in Bangladesh have changed.",
  "home.station.how": "How each value was checked against NASA's source data, and every rule behind the sound.",

  "opening.label": "Intro",
  "opening.escHint": "or press Esc",

  "listen.title": "Today's ocean and rain, as sound",
  "listen.hint": "Tap or drag on the map, or use the arrow keys, to hear another place.",
  "listen.hintDismiss": "Got it",
  "tour.start": "Take the tour",
  // Phone dock labels (under the icons); the full names show from 768 px.
  "dock.short.sweep": "Sweep",
  "dock.short.timelapse": "Storm",
  "dock.label.timelapse": "Storm time-lapse",
  "dock.short.stop": "Stop",
  "dock.short.tour": "Tour",
  "dock.short.mixer": "Mixer",
  "dock.short.inspector": "About",
  "dock.label": "Sound",
  "mixer.limited": "Mixer: some sound is muted or soloed",
  "inspector.open": "About this sound",
  "inspector.close": "Close",

  "thenNow.pageLead": "Decades of NASA and partner records for Bangladesh and the world, as sound.",
  "thenNow.view": "View",
  "thenNow.view.compare": "Compare decades",
  "thenNow.view.monthly": "Month by month",
  "thenNow.details": "Details",

  "how.lead": "We read each value back from the frame's colours, then checked it against NASA's source data. Every sound follows a written rule.",
  "how.ocean.figure": "median error against NASA MUR SST",
  "how.ocean.value": (p: { median: number }) => `${formatFixed(p.median, "en", 2)} °C`,
  "how.rain.figure": "typical difference from NASA IMERG",
  "how.rain.value": (p: { percent: number }) => `~${formatInteger(p.percent, "en")}%`,
  "how.rules.title": "Sound rules",
  "how.rules.figure": "sounds, each following a written rule",
  "how.rules.value": (p: { count: number }) => formatInteger(p.count, "en"),
  "how.globe.title": "Ground vs satellite",
  "how.globe.figure": "of place-days within 25 points of each other",
  "how.globe.value": (p: { percent: number }) => `${formatInteger(p.percent, "en")}%`,
  "how.open": "Read the full check",
  "how.openRules": "See every rule",
  "how.openGlobe": "Read the teaser",
  "how.credits": "Credits",
  "how.keys": "Keys and accessibility",

  "notFound.title": "No signal here",
  "notFound.text": "This page doesn't exist. Today's frames are still live on the map.",
  "notFound.back": "Go to Listen",
};
