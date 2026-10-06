// English UI strings: shell, controls, map, readout, help.

import { CREDIT_NAMES } from "../credits";
import { formatDegrees, formatRainRate, formatTemperature } from "../format";
import { PLACE_NAMES_EN } from "./places";

const deg = (v: number) => formatDegrees(v, "en");

export const appEn = {
  "app.title": "Earth Information Jukebox",
  "app.titleShort": "Jukebox", // phones, on screen only

  "start.lead": "Hear NASA's view of the latest ocean and rain as live sound.",
  "start.hint": "Headphones help: west sounds left, east sounds right.",
  "start.button": "Start listening",
  "start.silent": "Explore without sound",
  "start.silentHint": "Values appear as text and captions. You can turn sound on at any time.",
  "start.loading": "Loading the latest ocean frame…",
  "start.skipIntro": "Skip intro",

  "mode.explore": "Explore",
  "mode.story": "Tour",
  "mode.thenNow": "Then vs Now",

  "track.label": "What you hear",
  "track.ocean": "Ocean",
  "track.rain": "Rain",
  "track.both": "Both",
  "track.oceanLong": "Ocean temperature",
  "track.rainLong": "Rain and snow",

  "settings.describe": "Describe",
  "settings.captions": "Captions",
  "settings.builtInVoice": "Built-in voice",
  "settings.reduceMotion": "Reduce motion",
  "settings.language": "Language",
  "settings.open": "Settings",
  "lang.en": "English",
  "lang.bn": "বাংলা",

  "motif.play": "Play the Jukebox motif",
  "help.open": "Help",
  "help.keys": "Keys",

  "badge.comingOctober": "Coming in October",
  "badge.loadingRain": "Loading rain…",

  "map.roleDescription": "sound map",
  "map.instructions": "Arrow keys move 1 degree, Shift with arrows moves 10. Enter speaks the value. H lists all keys.",
  "map.alt": (p: { reading: string; place: string; track: string }) =>
    `${p.track}. ${p.reading} at ${p.place}.`,

  "place.latlon": (p: { lat: number; lon: number }) =>
    `${deg(p.lat)}° ${p.lat >= 0 ? "N" : "S"}, ${deg(p.lon)}° ${p.lon >= 0 ? "E" : "W"}`,
  "place.spoken": (p: { lat: number; lon: number }) =>
    `${deg(p.lat)} degrees ${p.lat >= 0 ? "north" : "south"}, ${deg(p.lon)} degrees ${p.lon >= 0 ? "east" : "west"}`,

  // Place History's places (the climate datasets' named cells).
  "place.Chattogram": PLACE_NAMES_EN.sweepCenter,
  "place.Dhaka": "Dhaka",
  "place.Rajshahi": "Rajshahi",
  "place.Sylhet": "Sylhet",

  "unit.celsius": "°C",
  "unit.mmPerHour": "mm/h",
  "reading.oceanValue": (p: { valueC: number }) => `${formatTemperature(p.valueC, "en")} °C`,
  "reading.oceanNone": "No ocean data here",
  "reading.rainValue": (p: { mmPerHour: number; frozen: boolean }) =>
    `${p.frozen ? "Snow" : "Rain"} ${formatRainRate(p.mmPerHour, "en")} mm/h`,
  "reading.dry": "Dry",
  "reading.rainNone": "No rain data here",
  "reading.rainLoading": "Rain is still loading",

  "speak.ocean": (p: { valueC: number }) => `${formatTemperature(p.valueC, "en")} degrees Celsius`,
  "speak.oceanNone": "No ocean data here",
  "speak.rain": (p: { mmPerHour: number; frozen: boolean }) =>
    `${p.frozen ? "Snow" : "Rain"}, ${formatRainRate(p.mmPerHour, "en")} millimetres per hour`,
  "speak.dry": "Dry",
  "speak.rainNone": "No rain data here",
  "speak.approx": "about ", // "~" read aloud
  "speak.value": (p: { reading: string; place: string }) => `${p.reading}, at ${p.place}.`,

  "frame.product.ocean": "Ocean temperature",
  "frame.product.rain": "Rain and snow",
  // Plan §16 "Frame label", exact wording.
  "frame.label": (p: { product: string; datetime: string }) =>
    `EIC frame: ${p.product}, ${p.datetime} UTC. Sound generated live from this frame.`,

  "sound.pause": "Pause sound",
  "sound.play": "Play sound",
  "sound.paused": "Sound paused",
  "sound.resumed": "Sound on",
  "sound.muteAll": "Mute all",
  "sound.unmuteAll": "Unmute all",
  "sound.stopped": "Stopped",
  "sound.turnOn": "Turn sound on",
  "sound.offHint": "Sound is off. Choose Turn sound on to hear it.",
  "mixer.label": "Mixer",
  "mixer.snow": "Snow",
  "mixer.muteShort": "Mute",
  "mixer.soloShort": "Solo",
  "mixer.volume": (p: { voice: string }) => `${p.voice} volume`,
  "mixer.mute": (p: { voice: string }) => `Mute ${p.voice}`,
  "mixer.solo": (p: { voice: string }) => `Solo ${p.voice}`,
  "sweep.play": "Play sweep",
  "sweep.needsRain": "The sweep starts once rain has loaded.",
  "timelapse.play": "Play storm time-lapse",
  "timelapse.stop": "Stop time-lapse",
  "timelapse.loadingStart": "Loading the time-lapse frames…",
  "timelapse.loading": (p: { loaded: number; total: number }) => `Loading the time-lapse: ${p.loaded} of ${p.total} files`,
  "timelapse.loadingShort": (p: { percent: number }) => `Loading ${p.percent}%`,
  "timelapse.error": "Couldn't load the time-lapse frames. Reload the page to try again.",
  "timelapse.announceStart": (p: { count: number; from: string; to: string }) =>
    `Storm time-lapse: ${p.count} rain frames, ${p.from} to ${p.to} UTC. The cursor follows the heaviest rain near Bangladesh.`,
  "timelapse.frame": (p: { index: number; total: number }) => `Time-lapse frame ${p.index} of ${p.total}`,
  // Satellite whisper (C7): the dataset names come from the frame metadata.
  "whisper.withRun": (p: { dataset: string; run: string }) => `${p.dataset}, ${p.run} run`,
  "whisper.and": " and ",
  "whisper.mission": (p: { agencies: string; mission: string; product: string; run: string | null }) =>
    `measured by ${p.agencies}'s ${p.mission} satellites (${p.product}${p.run ? `, ${p.run} run` : ""})`,
  "whisper.dataset": (p: { maker: string; name: string; kind: string; analysis: boolean; run: string | null }) =>
    `from ${p.maker}'s ${p.name} ${p.kind} ${p.analysis ? "analysis" : "data"}${p.run ? ` (${p.run} run)` : ""}`,
  "whisper.kind.sst": "sea surface temperature",
  "whisper.kind.rain": "rain",
  "whisper.announce": (p: { text: string; source: string }) => `${p.text} Source: ${p.source}.`,
  "xray.unavailable": "X-ray is coming in October: it needs NASA's colorbar data, which isn't published yet.",

  "announce.track": (p: { track: string }) => `Now hearing: ${p.track}.`,
  "announce.mode": (p: { mode: string }) => `${p.mode} mode.`,
  "announce.toggle": (p: { name: string; on: boolean }) => `${p.name} ${p.on ? "on" : "off"}.`,
  "announce.started": "Sound started. The cursor is over the Bay of Bengal. Arrow keys move it.",

  // Team plan §15 wording, split into what the app uses and what only our tests used
  // (contract-proposals E3). FIRMS, MODIS and GLOBE moved into the app on 28 Sep (fires,
  // vegetation, the GLOBE teaser); POWER is shown only as the record we dropped. Dataset names stay in English.
  "credits.visualizations": `Visualizations: ${CREDIT_NAMES.svs} for the ${CREDIT_NAMES.eic}.`,
  "credits.data": `Data in this app: ${CREDIT_NAMES.data}.`,
  "credits.testing": `Also used in our testing: ${CREDIT_NAMES.power} (dropped: it disagreed with independent records).`,

  "error.ocean": "Couldn't load the latest ocean frame. Check the connection and reload the page.",
  "error.rain": "Couldn't load the latest rain frame. Ocean sound still works; reload the page to try again.",

  // English prose from a data file (L1's JSON, L2's mapping.json), shown as the file gives it.
  "data.text": (p: { text: string }) => p.text,
};
