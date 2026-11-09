// The record rack, the mini player, the needle sliders and the cabinet.

import { formatFixed, formatInteger } from "../format";

const lonWord = (lon: number) => (lon < 0 ? "west" : "east");
const latWord = (lat: number) => (lat < 0 ? "south" : "north");
const withPlace = (text: string, place?: string | null) => (place ? `${text}, ${place}` : text);

export const recordsEn = {
  "records.label": "Records",
  "records.heading": "Pick a record",
  "records.group.A": "Live frames",
  "records.group.B": "Then vs Now",
  "records.group.C": "Official records",
  "records.group.D": "Guided",
  "records.source.A": "NASA EIC frames, played live",
  "records.source.B": "Then vs Now records",
  "records.source.C": "NASA EIC and SVS records",
  "records.source.D": "Guided listening",
  "records.count": (p: { count: number }) => `${formatInteger(p.count, "en")} records`,
  "records.legend.title": "How it sounds",
  "records.legend.subtitle": "Hear warm, cold, rain and snow",
  "records.both.title": "Ocean and rain together",
  "records.tour.title": "The tour",
  "records.sweep.title": "Sweep from Chattogram",
  "records.live": "Live",
  "records.chartOnly": "Chart only",
  "records.frames": (p: { count: number }) => `${formatInteger(p.count, "en")} frames`,
  "records.allOfficial": "All official records",
  "records.startHere": "Start here",
  "records.hint.legend": "New here? Play A0 to learn the sounds first.",
  "records.code": "Record code",
  "records.code.placeholder": "e.g. B2",
  "records.code.play": "Play",
  "records.code.none": (p: { code: string }) => `No record ${p.code}`,
  "records.nowPlaying": (p: { code: string; title: string }) => `Now playing ${p.code}, ${p.title}`,

  "records.kind.model": "Models",
  "records.kind.reanalysis": "Reanalysis",
  "records.kind.observation": "Observations",

  "player.nowPlaying": "Now playing",
  "player.previous": "Previous record",
  "player.next": "Next record",
  "player.upNext": "Up next",
  "player.open": (p: { record: string }) => `Now playing: ${p.record}. Open the player`,

  "needle.group": "Move the needle",
  "needle.westEast": "West to east",
  "needle.southNorth": "South to north",
  "needle.w": "W",
  "needle.e": "E",
  "needle.s": "S",
  "needle.n": "N",
  "needle.lonValue": (p: { lon: number; place?: string | null }) => withPlace(`${formatFixed(Math.abs(p.lon), "en", 1)}° ${lonWord(p.lon)}`, p.place),
  "needle.latValue": (p: { lat: number; place?: string | null }) => withPlace(`${formatFixed(Math.abs(p.lat), "en", 1)}° ${latWord(p.lat)}`, p.place),

  "skip.map": "Skip to map",
  "skip.records": "Skip to records",
  "skip.player": "Skip to player",

  "listen.howChecked": "How we checked these",

  "tube.ocean": (p: { value: string; min: string; max: string }) => `Ocean level: ${p.value} °C, on this frame's range of ${p.min} to ${p.max} °C`,
  "tube.rain": (p: { value: string; min: string; max: string }) => `Rain level: ${p.value} mm/h, on this frame's log scale of ${p.min} to ${p.max} mm/h`,
  "tube.ocean.none": "Ocean level: no value here",
  "tube.rain.none": "Rain level: dry or no value here",
};
