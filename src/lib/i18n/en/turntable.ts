// English strings for Turntable Earth. Bangla drafts for the Turntable live in
// src/components/Turntable/strings-bn.ts (Turntable only; bn.ts stays empty).

import type { CompassPoint } from "@/lib/geo/spherical";
import { formatInteger } from "../format";

const COMPASS_WORDS: Record<CompassPoint, string> = {
  N: "north",
  NE: "north-east",
  E: "east",
  SE: "south-east",
  S: "south",
  SW: "south-west",
  W: "west",
  NW: "north-west",
};

export const turntableEn = {
  "mode.turntable": "Turntable",

  "turntable.roleDescription": "turntable",
  "turntable.region": (p: { record: string }) => `Turntable Earth, playing the ${p.record} record`,
  "turntable.instructions":
    "Arrows turn the globe and move the needle (Shift: 10 degrees). Enter speaks the value. Slash searches places, L says where you are, " +
    "1 to 9 jump to bookmarks, T starts a tour, plus and minus zoom, V switches the view. H lists all keys. Esc goes back to the flat map.",
  "turntable.canvas": (p: { record: string }) =>
    `A realistic globe on a turntable with the latest available ${p.record} frame over it. A tonearm's needle reads the point beneath it.`,

  "turntable.records": "Records",
  "turntable.record.ocean": "Ocean",
  "turntable.record.rain": "Rain",
  "turntable.record.both": "Ocean + Rain",
  "turntable.record.air": "Air",
  "turntable.record.forests": "Forests",
  "turntable.record.fire": "Fire",
  "turntable.record.energy": "Energy",
  "turntable.record.seaLevel": "Sea level",
  "turntable.record.disasters": "Disasters",
  "turntable.record.agriculture": "Agriculture",
  "turntable.record.water": "Water and groundwater",
  "turntable.comingNext": "Coming next",
  "turntable.sleeve.details": "Details",
  "turntable.sleeve.cover": "Cover",
  "turntable.sleeve.play": (p: { record: string }) => `Play the ${p.record} record`,
  "turntable.sleeve.flip": (p: { record: string; back: boolean }) => (p.back ? `Show the ${p.record} cover` : `Show the ${p.record} details`),
  "turntable.sleeve.playing": "Playing",

  // Record labels: every value comes from sst.json / rain.json; "—" when a field is missing.
  "turntable.missing": "—",
  "turntable.frameTime": (p: { datetime: string }) => `Frame: ${p.datetime} UTC`,
  "turntable.age": (p: { days: number | null }) =>
    p.days === null
      ? "Latest available: —"
      : p.days < 1
        ? "Latest available: less than a day old"
        : `Latest available: ${formatInteger(p.days, "en")} ${p.days === 1 ? "day" : "days"} old`,
  "turntable.error": (p: { text: string }) => `Measured error: ${p.text}`,
  "turntable.error.rain": (p: { percent: number }) => `typically within ~${formatInteger(p.percent, "en")}% (pending team approval)`,

  "turntable.turn": "Turn",
  "turntable.stopTurning": "Stop turning",
  "turntable.slower": "Slower",
  "turntable.faster": "Faster",
  "turntable.speed": (p: { speed: number }) => `Speed ${p.speed}×`,
  "turntable.flatMap": "Flat map",
  "turntable.zoomIn": "Zoom in",
  "turntable.zoomOut": "Zoom out",
  "turntable.view.jukebox": "Jukebox view",
  "turntable.view.explore": "Close-up view",
  "turntable.view.label": "View",
  "turntable.opacity": "Data layer",
  "turntable.opacity.value": (p: { percent: number }) => `Data layer ${formatInteger(p.percent, "en")}%`,
  "turntable.sun.label": "Light",
  "turntable.sun.frame": "Sun at frame time",
  "turntable.sun.day": "Always day",
  "turntable.graticule": "Grid lines",
  "turntable.quality": "Quality",
  "turntable.quality.auto": "Auto",
  "turntable.quality.ultra": "Ultra",
  "turntable.quality.high": "High",
  "turntable.quality.low": "Low",
  "turntable.settings": "Globe settings",
  "turntable.dock": "Turntable controls",
  "turntable.dock.speed": "Turning and speed",
  "turntable.dock.layers": "Layers and sound",
  "turntable.dock.settings": "Settings",
  "turntable.dock.help": "Keys and help",
  "turntable.details.open": "Details of the value under the needle",
  "turntable.details.pin": "Keep details open",
  "turntable.details.unpin": "Let details close",
  "turntable.details.close": "Close details",
  "turntable.layers.note": "Clouds, borders and names are decoration. The data layer, values and sound don't change.",
  "turntable.layers.decoration": "Background and map layers",
  "turntable.layers.clouds": "Clouds",
  "turntable.layers.labels": "Place names",
  "turntable.layers.borders": "Borders",
  "turntable.layers.districts": "Districts",
  "turntable.layers.rivers": "Rivers",
  "turntable.layers.sound": "Sound mixer",
  "turntable.howWeKnow": "How we know",
  "turntable.creditsLink": "Credits",
  "turntable.intro.skip": "Press any key to skip",
  "turntable.skip": "Skip animation",

  "turntable.search.label": "Search places",
  "turntable.search.placeholder": "Search a place: Dhaka, Sundarbans, Bay of Bengal…",
  "turntable.search.none": "No place found",
  "turntable.search.loading": "Places are still loading",
  "turntable.search.count": (p: { count: number }) => `${formatInteger(p.count, "en")} ${p.count === 1 ? "place" : "places"} found`,
  "turntable.kind.story": "Story place",
  "turntable.kind.country": "Country",
  "turntable.kind.city": "City",
  "turntable.kind.district": "District, Bangladesh",
  "turntable.kind.sea": "Sea or ocean",

  "turntable.where.button": "Where am I?",
  "turntable.where.city": (p: { city: string; country: string }) => `${p.city}, ${p.country}`,
  "turntable.where.near": (p: { km: number; dir: CompassPoint; city: string; country: string }) =>
    `${formatInteger(p.km, "en")} km ${p.dir} of ${p.city}, ${p.country}`,
  "turntable.where.nearSpoken": (p: { km: number; dir: CompassPoint; city: string; country: string }) =>
    `${formatInteger(p.km, "en")} kilometres ${COMPASS_WORDS[p.dir]} of ${p.city}, ${p.country}`,
  "turntable.where.district": (p: { district: string }) => `${p.district} District`,
  "turntable.where.unnamed": "No named place nearby",
  "turntable.arrived": (p: { place: string; reading: string }) => `Arrived: ${p.place}. ${p.reading}.`,
  "turntable.speak": (p: { value: string; place: string; latlon: string; datetime: string }) =>
    `${p.value}, at ${p.place}, ${p.latlon}. Frame time ${p.datetime} UTC, latest available.`,

  "turntable.bookmarks": "Bookmarks",
  "turntable.bookmark": (p: { key: number; place: string }) => `${p.key}: ${p.place}`,
  "turntable.tour.start": "Tour",
  "turntable.tour.stop": "Stop tour",
  "turntable.tour.stop.announce": "Tour stopped",
  "turntable.tour.at": (p: { index: number; total: number; place: string }) => `Tour stop ${p.index} of ${p.total}: ${p.place}`,
  "turntable.tour.done": "Tour finished",
  "turntable.myLocation": "My location",
  "turntable.myLocation.note": "Used once to fly there. Never stored or sent anywhere.",
  "turntable.myLocation.denied": "Location wasn't shared. Nothing was stored.",
  "turntable.myLocation.unsupported": "This browser can't share a location.",
  "turntable.idleHint": "Press / to search a place",
  "turntable.background": "Background: Blue Marble composite, not today's clouds",
  "turntable.credits":
    "Background: NASA Earth Observatory, Blue Marble Next Generation, September (Reto Stöckli) · " +
    "Night: NASA Earth Observatory, Black Marble 2016 (Joshua Stevens; Suomi NPP VIIRS data, Miguel Román, NASA GSFC) · " +
    "Topography: NASA Earth Observatory (Jesse Allen), GEBCO data from the British Oceanographic Data Centre · Clouds: NASA Visible Earth · " +
    "Studio light: Poly Haven studio_small_09 (CC0) · Atmosphere: Bruneton precomputed scattering via takram three-atmosphere (MIT) · " +
    "Borders, places, rivers, seas: Natural Earth (public domain) · Districts: geoBoundaries (CC BY 3.0 IGO; source BBS, OCHA ROAP) · " +
    "Data frames: NASA SVS 5101 / 4285 for the NASA Earth Information Center",
  "turntable.inset": "World map: the dot is the needle",
  "turntable.legend.ocean": "This frame's ocean temperature range",
  "turntable.legend.rain": "This frame's rain range (logarithmic)",
  "turntable.legend.pixel": "Frame pixel under the needle",
  "turntable.legend.noValue": "No value here",
  "turntable.legend.marker": "Needle value",
  "turntable.panels.hide": "Hide panels",
  "turntable.panels.show": "Show panels",
  "turntable.graticule.equator": "Equator",
  "turntable.graticule.cancer": "Tropic of Cancer",
  "turntable.graticule.capricorn": "Tropic of Capricorn",

  "turntable.announce.record": (p: { record: string; frames: string }) => `Record: ${p.record}. ${p.frames}`,
  "turntable.announce.frame": (p: { product: string; datetime: string }) =>
    `${p.product}, latest available frame ${p.datetime} UTC.`,
  "turntable.announce.turning": "Turning",
  "turntable.announce.stoppedTurning": "Turning stopped",
  "turntable.announce.view": (p: { view: string }) => `${p.view}.`,
  "turntable.stopped": "Stopped. Back to the flat map.",

  "caption.earcon.needleDrop": "Needle drop: a new record",

  "help.turntable": "On the turntable",
  "key.tt.leftRight": "Left / Right",
  "key.tt.leftRight.action": "Turn the globe 1 degree (with Shift: 10 degrees); stops the turning",
  "key.tt.upDown": "Up / Down",
  "key.tt.upDown.action": "Move the needle 1 degree north or south (with Shift: 10 degrees), up to 80 degrees",
  "key.tt.space.action": "Start or stop the turning",
  "key.tt.enter.action": "Speak the value, place and frame time under the needle, and show its details",
  "key.tt.details.action": "Show or hide the details of the value under the needle",
  "key.tt.dock.action": "Move focus to the controls (D still turns describing on or off)",
  "key.tt.r.action": "Next / previous record",
  "key.tt.search.action": "Search a place (G works too)",
  "key.tt.where.action": "Where am I? (Shift+L: hear the legend)",
  "key.tt.bookmarks.action": "Jump to a bookmarked place",
  "key.tt.tour.action": "Start or stop the tour",
  "key.tt.zoom.action": "Zoom in / out",
  "key.tt.speed.action": "Turn slower / faster",
  "key.tt.view.action": "Jukebox view / close-up view",
  "key.tt.opacity.action": "Data layer opacity (0, 25, 50, 85, 100%)",
  "key.tt.esc.action": "Stop a tour or flight, or close search; otherwise stop all sound and go back to the flat map",
};
