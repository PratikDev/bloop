// The Science to Art dial (docs/statement/ART.md). Braille rules apply: no arrows or dashes.

import type { ChangeKey } from "@/lib/art/dial";

type Changes = { [K in ChangeKey as `dial.change.${K}`]: string };

const changes = {
  "dial.change.timbre": "timbre",
  "dial.change.ticks": "faint gridline ticks",
  "dial.change.bed": "a soft bed",
  "dial.change.chord": "the value chord",
  "dial.change.drone": "a drone on Sa",
  "dial.change.reverb": "light reverb",
  "dial.change.meend": "swara and meend glides",
} satisfies Changes;

export const dialEn = {
  ...changes,
  "dial.label": "Science to Art",
  "dial.stop.0": "Measure",
  "dial.stop.0.5": "Blend",
  "dial.stop.1": "Music",
  "dial.stopHint.0": "0, Measure",
  "dial.stopHint.0.5": "0.5, Blend",
  "dial.stopHint.1": "1, Music",
  "dial.unchanged": "Data voice: unchanged at every position.",
  "dial.whatChanges": (p: { list: string }) => `What changes: ${p.list}.`,
  "dial.announce": (p: { stop: string }) => `Dial: ${p.stop}, data unchanged`,
  "dial.chord.none": "Value chord: not available in this version, so none plays.",
  "dial.chord.off": "Value chord: off with two data voices (Both).",
  "dial.chord.blocked": (p: { why: string }) => `Value chord: silent here (${p.why}).`,
  "dial.chord.optIn": "Value chord: off until you turn it on (Settings, Chord: spread of values).",
  "dial.chord.why.pattern-only": "pattern only, no values",
  "dial.chord.why.not-allowlisted": "this colour bar isn't on the list",
  "dial.chord.why.both": "two data voices already",
  "dial.chord.why.duet": "two data voices already",
  "dial.chord.why.no-data": "no values here",
  "dial.chord.why.off": "off",
  "dial.season": (p: { colour: string }) => `Artistic choice: season colour (${p.colour}). Sa never moves.`,
  "dial.season.monsoon": "monsoon, fuller and darker",
  "dial.season.dry": "dry season, lighter",
  "dial.artistic": "Interpretation, not measurement: everything the dial adds is our artistic choice.",
  "dial.check": "Check the data voice",
  "dial.checking": "Checking: rendering every position",
  "dial.check.pass": (p: { cents: string; notes: string; stops: string }) =>
    `Same data voice at ${p.stops} positions: ${p.notes} notes, largest pitch difference ${p.cents} cents (limit 1), same onsets and tempo.`,
  "dial.check.fail": (p: { cents: string }) => `Check failed: a difference of ${p.cents} cents. Please report it.`,
  "dial.check.drops": (p: { onsets: string; stops: string }) => `Same drops at ${p.stops} positions: ${p.onsets} onsets, same timing.`,
  "dial.check.none": "No data voice here to check.",
  "dial.hwgt.subject": "the data voice check",
  "dial.hwgt.method":
    "The record's own values are played through its rule and rendered offline (OfflineAudioContext) with the art layer off, then at 0, 0.5 and 1. The data voice is rendered on its own channel; its settled pitch per note is measured from the audio (a fine search of the windowed spectrum) and compared with the art-off render and with the rule. Onsets and tempo come from the renderer's log.",
  "dial.hwgt.uncertainty": "The measurement resolves well under 0.1 cent on these renders; the limit is 1 cent.",
  "dial.hwgt.n": (p: { notes: string }) => `${p.notes} notes per position`,
  "dial.braille": (p: { stop: string }) => `Dial: ${p.stop}, data unchanged`,
};

export const proofEn = {
  "proof.title": "Data voice check",
  "proof.figureLabel": "The data voice is the same at every dial position and in every family",
  "proof.limit": "1 cent limit",
  "proof.explain":
    "Each record's own values are rendered offline with the art off, then at Measure, Blend and Music, and in every Earth Orchestra family. The data voice's settled pitch is measured from the audio and must stay within 1 cent; its onsets and tempo must not change.",
  "proof.record.ocean": "Check live sea surface temperature (MUR)",
  "proof.record.rain": "Check IMERG rain (the storm time-lapse)",
  "proof.record.currents_3912": "Check SVS 3912 sea surface temperature",
  "proof.record.heat": "Check Then vs Now heat (GISTEMP, yearly)",
  "proof.record.monsoon": "Check Then vs Now monsoon rain (GPCP, yearly)",
  "proof.record.water": "Check Then vs Now stored water (GRACE, yearly)",
  "proof.categories": "Check every Earth Orchestra family",
  "proof.categories.pass": (p: { families: string; cents: string; notes: string }) =>
    `${p.families} families, as the live voice and as notes: ${p.notes} notes each, largest pitch difference ${p.cents} cents (limit 1).`,
  "proof.open": "How the check works",
};
