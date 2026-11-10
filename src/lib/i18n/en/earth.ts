// English strings for the DATA records (docs/prompts/CLAUDE_CODE_PROMPT_data_maximize.md): Data health, the leftovers,
// fire weather, Fire Geiger, landslide exposure, night lights, NASA's radar method. No number is typed next to a unit:
// every value is a {param} filled from the shipped files. Bangla drafts: bn/earth.ts.

export const earthEn = {
  // P1: "Is this data fresh?" (in every How we got this) and the Data health page.
  "earth.fresh.heading": "Is this data fresh?",
  "earth.fresh.lastData": "Newest data shipped",
  "earth.fresh.sourceLatest": "Newest at the source",
  "earth.fresh.lag": "Lag",
  "earth.fresh.lagValue": (p: { days: string }) => `${p.days} d behind the source`,
  "earth.fresh.checks": "Checks",
  "earth.fresh.checksValue": (p: { passed: string; failed: string }) => `${p.passed} passed, ${p.failed} failed`,
  "earth.fresh.failed": (p: { checks: string }) => `Failed: ${p.checks}`,
  "earth.fresh.run": "Last health run",
  "earth.fresh.none": "This record is not in the latest health run.",
  "earth.fresh.loading": "Loading the health run.",
  "earth.health.title": "Data health",
  "earth.health.lead":
    "Every record and product in the latest health run: how new its data is, how far behind its source, and how many checks passed. Read from meta/health.json.",
  "earth.health.caption": (p: { n: string; date: string }) => `${p.n} records, health run of ${p.date}`,
  "earth.health.col.record": "Record",
  "earth.health.col.category": "Kind",
  "earth.health.col.lastData": "Newest data",
  "earth.health.col.sourceLatest": "Newest at source",
  "earth.health.col.lag": "Lag",
  "earth.health.col.checks": "Checks passed / failed",
  "earth.health.passFail": (p: { passed: string; failed: string }) => `${p.passed} / ${p.failed}`,
  "earth.health.lagDays": (p: { days: string }) => `${p.days} d`,
  "earth.health.loading": "Loading the health run.",
  "earth.health.error": "The health run could not be loaded.",
  "earth.health.open": "Open Data health",
  "earth.health.cardTitle": "Is every record fresh?",
  "earth.health.cardLead": "One row per record: newest data, lag behind the source, checks passed and failed.",
  "earth.health.back": "Back to How we know",
  "earth.health.keys": "The table is one stop for Tab; scroll it with the arrow keys. Each row starts with the record's name.",

  // P1: the live frames' acceptance checks (public/data/official/live_*/validation.json).
  "earth.check.heading": "Acceptance check (from validation.json)",
  "earth.check.line": (p: { title: string; numbers: string; result: string }) => `${p.title}: ${p.numbers}. Result: ${p.result}.`,
  "earth.check.loading": "Loading the acceptance check.",

  // P1: related records kept off the shelves (related/index.json `hidden`).
  "earth.notPlayable.heading": "Not playable: too sparse to sonify honestly",
  "earth.notPlayable.lead": "Decoded, but kept off the shelves: a needle would read no value most of the time. The pipeline's reason for each:",
  "earth.notPlayable.loading": "Loading the related records.",
  "earth.notPlayable.subject": "the records kept off the shelves",
  "earth.notPlayable.dataset": "Bloop's related records index (public/data/related/index.json), its hidden rows",
  "earth.notPlayable.method":
    "The pipeline decodes each related record, counts the share of cells with a value at each time step, and hides a record that has values in too few cells, or in no cell at every step. The reason is the pipeline's own sentence.",
  "earth.notPlayable.n": (p: { n: string }) => `${p.n} records hidden`,

  // Record titles (the record index's rows; index titles are English).
  "earth.fire.title": "Fires and fire weather",
  "earth.slide.title": "Landslide exposure (LHASA, modelled)",
  "earth.lights.title": "Night lights by city (Black Marble)",

  // Data age (freshness.json; past its limit a product is "recorded").
  "earth.age.from": (p: { date: string }) => `Data from ${p.date}.`,
  "earth.age.stale": (p: { date: string }) => `Data from ${p.date}; may be out of date.`,

  // Shared map and controls of the DATA records.
  "earth.map.keys": "Arrow keys move the needle by one degree, Shift+arrow by five; or click the map.",
  "earth.map.needle": (p: { place: string }) => `Needle: ${p.place}`,
  "earth.play": "Play at the needle",
  "earth.stop": "Stop",
  "earth.describe": "Describe",
  "earth.braille": "Braille line",
  "earth.liner": "Liner notes",
  "earth.viewTable": "View as table",
  "earth.hideTable": "Hide table",
  "earth.badge.off": "off",
  "earth.badge.silent": "stated silence",

  // P2: fires and fire weather.
  "earth.fire.lead":
    "Two sound layers: tomorrow's fire weather as a fixed chord at the needle, and FIRMS hotspots as Geiger clicks for the chosen box and day. NASA's fire picture sits underneath.",
  "earth.fire.fwiLabel": "Fire weather: an experimental 1-day forecast (NASA GISS GlobalFWI, a model), never a measured fire.",
  "earth.fire.fwiAt": (p: { cls: string; date: string; sound: string }) => `Fire weather forecast for ${p.date}: ${p.cls}. ${p.sound}`,
  "earth.fire.fwiChord": "Sound: its fixed chord.",
  "earth.fire.fwiSilent": "Sound: silence (stated).",
  "earth.fire.fwiNone": "Silence: no forecast at this point (no calculation).",
  "earth.fire.firmsAt": (p: { count: string; box: string; day: string; sat: string }) => `FIRMS: ${p.count} hotspots in ${p.box} on ${p.day} (${p.sat}).`,
  "earth.fire.firmsZero": (p: { box: string; day: string; sat: string }) => `Silence: no detections in this box (${p.box}, ${p.day}, ${p.sat}).`,
  "earth.fire.firmsNoDay": "No FIRMS count for this day from this sensor: no data, not a zero.",
  "earth.fire.pixelNote": "A hotspot is a pixel containing one or more fires, not one fire.",
  "earth.fire.picture": "Picture: NASA's SVS 5113 active fires, a five-day fire radiative power window. Display only: the sound uses FIRMS counts.",
  "earth.fire.pictureSat": (p: { sat: string }) => `The picture's satellite: ${p.sat}.`,
  "earth.fire.pictureSatNone": "The picture's satellite: not named in its file (VIIRS active fires).",
  "earth.fire.pictureAlt": (p: { date: string }) =>
    `NASA's map of active fires (SVS 5113), frame of ${p.date}: fire pixels drawn over the Earth; the FIRMS boxes are outlined, the needle is the ring.`,
  "earth.fire.box": "FIRMS box",
  "earth.fire.sensor": "Sensor",
  "earth.fire.day": "Day",
  "earth.fire.layers": "Sound layers",
  "earth.fire.layer.chord": "Fire-weather chord",
  "earth.fire.layer.clicks": "Geiger clicks",
  "earth.fire.badge.chord": (p: { state: string }) => `Chord: ${p.state}`,
  "earth.fire.badge.clicks": (p: { state: string }) => `Clicks: ${p.state}`,
  "earth.fire.badge.rate": (p: { rate: string }) => `${p.rate} a second`,
  "earth.fire.scale": (p: { cmin: string; cmax: string; min: string; max: string }) =>
    `Click scale: ${p.cmin} hotspot a day gives ${p.min} clicks a second, ${p.cmax} or more give ${p.max} (logarithmic).`,
  "earth.fire.brightness": "Brightness: more fire radiative power per hotspot, brighter clicks; never louder.",
  "earth.fire.bdNow": (p: { date: string; cls: string }) => `Bangladesh on the forecast for ${p.date}: mostly ${p.cls}.`,
  "earth.fire.regionsLead": "The three most active fire-weather regions in this grid, found by Bloop's code. One click moves the needle there:",
  "earth.fire.region": (p: { place: string; cls: string }) => `${p.place} (${p.cls})`,
  "earth.fire.offSeason": (p: { day: string }) => `Off-season: no detections in Bangladesh on ${p.day} from any sensor.`,
  "earth.fire.season": (p: { place: string; sensor: string; year: string }) => `Fire season example: ${p.place}, March to April ${p.year} (${p.sensor}, archive)`,
  "earth.fire.seasonStep": (p: { day: string; count: string }) => `${p.day}: ${p.count} hotspots`,
  "earth.fire.seasonStop": "Stop the example",
  "earth.fire.replay": "Replay the archive (forecast meets outcome)",
  "earth.fire.replayStop": "Stop the replay",
  "earth.fire.replayStep": (p: { i: string; n: string; issued: string; forDay: string; cls: string; outcome: string }) =>
    `Day ${p.i} of ${p.n}: forecast issued ${p.issued} for ${p.forDay}: ${p.cls}. ${p.outcome}`,
  "earth.fire.outcome": (p: { count: string; box: string; sat: string }) => `FIRMS that day: ${p.count} hotspots in ${p.box} (${p.sat}).`,
  "earth.fire.outcomeNone": "No FIRMS count yet for that day.",
  "earth.fire.table.caption": (p: { box: string }) => `FIRMS hotspots per day in ${p.box}`,
  "earth.fire.table.day": "Day",
  "earth.fire.table.frp": (p: { sat: string }) => `${p.sat} FRP sum, MW`,
  "earth.fire.subject.fwi": "the fire-weather class at the needle",
  "earth.fire.subject.firms": "the FIRMS hotspot counts",
  "earth.fire.subject.picture": "the fire picture",
  "earth.fire.method.fwi":
    "The pipeline reads the class of each pixel of SVS 5315's picture from its six legend colours (a 3×3 majority filter), then maps it from Robinson to a 1024×512 latitude-longitude grid; Bloop reads the cell under the needle.",
  "earth.fire.method.firms": "FIRMS near-real-time detections, counted per day inside each fixed box (Bangladesh inside its outline), with their fire radiative power summed.",
  "earth.fire.method.picture": "NASA's picture, shown as it is: no value is read from it.",
  "earth.fire.cell": "One cell of the 1024×512 class grid.",
  "earth.fire.boxCell": (p: { box: string }) => `The ${p.box} box.`,
  "earth.fire.describe.brief": (p: { fwi: string; firms: string }) => `${p.fwi} ${p.firms}`,
  "earth.fire.describe.more": (p: { pixel: string; regions: string }) => `${p.pixel} ${p.regions}`,
  "earth.fire.regionsLine": (p: { list: string }) => `Most active fire-weather regions now: ${p.list}.`,

  "earth.pilot.heading": "Forecast meets outcome: pilot check, experimental forecast",
  "earth.pilot.lead":
    "Each archived forecast's class for a FIRMS box (its most common class) beside FIRMS's count there on the day it forecast. A pilot check: no skill is claimed unless n is large and the agreement clear.",
  "earth.pilot.col.box": "Box",
  "earth.pilot.col.issued": "Issued",
  "earth.pilot.col.forDay": "For",
  "earth.pilot.col.class": "Forecast class",
  "earth.pilot.rho": (p: { sat: string; rho: string; n: string }) => `${p.sat}: Spearman rho ${p.rho}, n ${p.n}`,
  "earth.pilot.rhoNone": (p: { sat: string; n: string }) => `${p.sat}: rho undefined (no variation), n ${p.n}`,
  "earth.pilot.noClaim": "Too few days to tell: no skill is claimed.",
  "earth.pilot.claim": "Agreement on these days: still a pilot, not a skill score.",
  "earth.pilot.loading": "Loading the archived forecasts.",
  "earth.pilot.open": "Show the pilot table",

  // P2a on Listen: the fire-weather layer at the needle.
  "earth.layer.menu": "Fire weather",
  "earth.layer.full": "Fire-weather layer (experimental forecast)",
  "earth.layer.switch": "Play tomorrow's fire weather at the needle",
  "earth.layer.on": "Fire-weather chord on.",
  "earth.layer.off": "Fire-weather chord off.",
  "earth.layer.loading": "Loading the fire-weather forecast.",

  // How we got this for the DATA products (src/lib/earth/provenance.ts).
  "earth.hwgt.sourceTime": (p: { time: string }) => `newest source time ${p.time}`,

  // P1: the SVS 5176 picture under the normal tone (Sound terrain, N).
  "earth.anom.legend": "Ocean temperature vs normal (the 5176 picture)",
  "earth.anom.frame": (p: { date: string }) => `Picture and anomaly: the SVS 5176 frame of ${p.date}`,
  "earth.anom.alt": (p: { date: string; min: string; max: string }) =>
    `NASA's map of ocean temperature against normal, frame of ${p.date}: blue cooler than normal, red warmer, from ${p.min} to ${p.max} degrees Celsius.`,
};
