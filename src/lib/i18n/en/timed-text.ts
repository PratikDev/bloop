// English for the accessibility core, step 7: the timed text tracks (WebVTT), the sound captions, the transcript page
// per record and the alt text that goes with an export. Sound captions follow the DCMP style: in brackets, lowercase
// for the sound, present tense, what makes it named. Every number is a slot formatted from the data.

import type { CaptionParams } from "@/lib/audio-adapter/types";
import { strParam } from "./captions";

type Place = { place: string };
type Valued = { value: string; place: string };

export const timedTextEn = {
  "tt.what.sweep": "sweep",
  "tt.what.timelapse": "storm time-lapse",
  "tt.kind.metadata": "metadata",
  "tt.kind.chapters": "chapters",
  "tt.kind.captions": "captions",
  "tt.file.note": (p: { what: string; kind: string }) => `Bloop ${p.what}, ${p.kind} track. Written from the same steps the sound plays.`,
  "tt.note.land": "land or no ocean data",
  "tt.note.nodata": "no rain data",
  "tt.note.dry": "dry",
  "tt.note.rain": (p: { value: string }) => `rain, ${p.value} millimetres an hour`,
  "tt.note.snow": (p: { value: string }) => `snow, ${p.value} millimetres an hour`,
  "tt.chapter.ring": (p: { n: string; total: string; deg: string; place: string }) => `Ring ${p.n} of ${p.total}: ${p.deg} degrees out from ${p.place}`,
  "tt.chapter.region": (p: { region: string; time: string }) => `${p.region}, from ${p.time}`,
  "tt.cap.sweepBegin": (p: Place) => `[tones begin: the sweep moves outward from ${p.place}]`,
  "tt.cap.sweepEnd": "[tones stop: the sweep is finished]",
  "tt.cap.warmest": (p: Valued) => `[highest tone: the warmest water in the sweep, ${p.value} degrees Celsius, ${p.place}]`,
  "tt.cap.coolest": (p: Valued) => `[lowest tone: the coolest water in the sweep, ${p.value} degrees Celsius, ${p.place}]`,
  "tt.cap.land": (p: Place) => `[soft tick, then silence: no ocean data, ${p.place}]`,
  "tt.cap.wettest": (p: Valued) => `[densest drops: the heaviest rain in the sweep, ${p.value} millimetres an hour, ${p.place}]`,
  "tt.cap.snowiest": (p: Valued) => `[busiest bells: the heaviest snow in the sweep, ${p.value} millimetres an hour, ${p.place}]`,
  "tt.cap.lapseBegin": (p: { count: string }) => `[the time-lapse begins: ${p.count} rain frames, half an hour apart]`,
  "tt.cap.lapseEnd": "[drops stop: the time-lapse is finished]",
  "tt.cap.dropsBegin": (p: Place) => `[drops begin: rain, ${p.place}]`,
  "tt.cap.bellsBegin": (p: Place) => `[bells begin: snow, ${p.place}]`,
  "tt.cap.dropsStop": (p: Place) => `[drops stop: dry, ${p.place}]`,
  "tt.cap.lapseNodata": (p: Place) => `[soft tick, then silence: no rain data, ${p.place}]`,
  "tt.cap.lapsePeak": (p: Valued & { time: string }) => `[densest drops: the heaviest rain in the time-lapse, ${p.value} millimetres an hour, ${p.place}, ${p.time}]`,
  "tt.cap.lapsePeakSnow": (p: Valued & { time: string }) => `[busiest bells: the heaviest snow in the time-lapse, ${p.value} millimetres an hour, ${p.place}, ${p.time}]`,
  "tt.nowPlaying": (p: { place: string; value: string }) => `Now playing: ${p.place}. ${p.value}`,
  "tt.nowPlayingAt": (p: { place: string; value: string; time: string }) => `Now playing: ${p.time}, ${p.place}. ${p.value}`,
  "tt.value.temp": (p: { value: string }) => `${p.value} degrees Celsius`,
  "tt.value.rain": (p: { value: string }) => `${p.value} millimetres an hour`,

  // A captions cue from the run playing now (src/lib/timed-text/live.ts), passed in both languages.
  "caption.cue": (p: CaptionParams) => strParam(p, "en"),
  "caption.sonar.ping": "Sonar ping",

  // Sound captions: a short visual note on what the last sound did (spec 3.5), beside the caption bar.
  "sound.toneUp": "tone rising ↑ warmer",
  "sound.toneDown": "tone falling ↓ cooler",
  "sound.dropsUp": "rain thickening ↑",
  "sound.dropsDown": "rain easing ↓",
  "sound.pingNearer": "ping quickening ↑ nearer",
  "sound.pingFarther": "ping slowing ↓ farther",
  "sound.pingSame": "ping steady",
  "sound.beatsDiffer": "beats = the two values differ",
  "sound.beatsDisagree": "beats = the two sources disagree",

  // The transcript page (WCAG G158: a text version that tells the same story as the sound).
  "transcript.linkFor": (p: { record: string }) => `Transcript: ${p.record}`,
  "transcript.title": (p: { record: string }) => `Transcript: ${p.record}`,
  "transcript.lead": "A text version of this record's sound. It tells the same story: how the sound is made, what it covers, the pattern, the moments to listen for, and how far to trust it.",
  "transcript.mapping": "How the sound is made",
  "transcript.range": "What it covers",
  "transcript.pattern": "The pattern",
  "transcript.meaning": "What this means",
  "transcript.moments": "Moments to listen for",
  "transcript.momentsLead": (p: { what: string }) => `From the ${p.what}'s caption track; times from its start.`,
  "transcript.momentsNone": "No moments to list: the record could not load.",
  "transcript.trust": "How we got this, and how far to trust it",
  "transcript.svs": "NASA's description",
  "transcript.svsCredit": (p: { ids: string }) => `From NASA's Scientific Visualization Studio, SVS ${p.ids}.`,
  "transcript.noSvs": (p: { dataset: string }) => `This record has no Scientific Visualization Studio page: Bloop draws it from the data file itself (${p.dataset}).`,
  "transcript.files": "Timed text files",
  "transcript.filesLead": (p: { what: string }) => `The ${p.what}'s WebVTT tracks, written from the same steps the sound plays: the captions describe each sound, the chapters mark where it is, and the metadata gives every step's place and value.`,
  "transcript.download": (p: { kind: string }) => `Download the ${p.kind} (.vtt)`,
  "transcript.loading": "Loading the record.",
  "transcript.error": "This record could not load.",
  "transcript.choose": "Transcripts",
  "transcript.layerRange": (p: { label: string; min: string; max: string; unit: string }) => `${p.label}: from ${p.min} to ${p.max} ${p.unit}.`,
  "transcript.layerPattern": (p: { label: string }) => `${p.label}: shown as a pattern only, from very low to very high; no value is read from it.`,
  "transcript.highest": (p: { label: string; value: string; unit: string; place: string; time: string }) => `Highest ${p.label}: ${p.value} ${p.unit}, ${p.place}, ${p.time}.`,
  "transcript.lowest": (p: { label: string; value: string; unit: string; place: string; time: string }) => `Lowest ${p.label}: ${p.value} ${p.unit}, ${p.place}, ${p.time}.`,
  "transcript.at": (p: { time: string; text: string }) => `${p.time}: ${p.text}`,

  // Alt text that goes with an export (spec 3.6): a sidecar .txt, and the STL file's own header.
  "alt.save": "Save its description (.txt)",
  "alt.saved": (p: { file: string }) => `Saved ${p.file}`,
  "alt.heading.alt": "Alt text",
  "alt.heading.extended": "Extended description",
  "alt.tactile": (p: { label: string; size: string }) => `Tactile disc, ${p.size} millimetres across: ${p.label}.`,
  "alt.tactileOne": "One raised ring runs once around the disc, clockwise from the top.",
  "alt.tactileMany": (p: { n: string; names: string }) => `${p.n} raised rings run once around the disc, clockwise from the top; from the centre out: ${p.names}.`,
  "alt.tactileSpan": (p: { first: string; last: string }) => `${p.first} is at the top; ${p.last} is just before it.`,
  "alt.tactileHeight": (p: { min: string; max: string; unit: string; low: string; high: string }) => `A ring is ${p.low} millimetres high at ${p.min} ${p.unit} and ${p.high} millimetres high at ${p.max} ${p.unit}.`,
  "alt.tactileTicks": "Raised ticks outside the rings mark every ten years. Where a step has no value, the disc stays flat. The label is embossed above the centre hole.",
  "alt.tactileExtreme": (p: { which: string; ring: string; step: string; value: string; unit: string }) => `${p.which}, ${p.ring}: ${p.step}, ${p.value} ${p.unit}.`,
  "alt.highest": "Highest",
  "alt.lowest": "Lowest",
};
