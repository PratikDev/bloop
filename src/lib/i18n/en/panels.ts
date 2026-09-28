// English strings for the side sheet: Truth, Mapping, Provenance, History.

import { formatFixed, formatInteger } from "../format";

export const panelsEn = {
  "panel.label": "About this sound",
  "panel.truth": "Truth",
  "panel.mapping": "Mapping",
  "panel.provenance": "Provenance",
  "panel.history": "History",

  "truth.intro": "We read each value back from the frame's colours, then checked those values against NASA's source data.",
  "truth.ocean.heading": "Ocean temperature",
  // Shown only if sst.json ever arrives without its calibration.
  "truth.ocean.updating": "Verification being updated",
  "truth.ocean.updatingNote":
    "The ocean colorbar was recalibrated, and the new error is waiting for a check on a separate frame before we show it.",
  // Ocean and rain sentences: L1's templates (docs/L1/DATA_HANDOFF.md §4), filled from the JSON;
  // pending until the team adopts them in plan §16.
  "truth.ocean.sentence": (p: { lo: number; hi: number; legend: string; median: number; points: number }) =>
    `Colour scale checked against NASA MUR SST: the frame's colours match ${formatInteger(p.lo, "en")}…${formatInteger(p.hi, "en")} °C ` +
    `(the legend reads ${p.legend}). Median error ${formatFixed(p.median, "en", 2)} °C (${formatInteger(p.points, "en")} points).`,
  "truth.ocean.recheck": (p: { date: string; median: number }) =>
    `Also checked on the ${p.date} frame: median error ${formatFixed(p.median, "en", 2)} °C.`,
  "truth.rain.heading": "Rain",
  "truth.rain.sentence": (p: { run: string; percent: number; points: number; oneFrame: boolean; allAgreed: boolean; agreedPct: number }) =>
    `Checked against NASA IMERG ${p.run} run: typically within ~${formatInteger(p.percent, "en")}% ` +
    `(${formatInteger(p.points, "en")} rain points${p.oneFrame ? ", one frame" : ""}); ` +
    (p.allAgreed
      ? "agreed on where it was raining at every sampled point."
      : `agreed on rain vs no rain at ${formatInteger(p.agreedPct, "en")}% of sampled points.`),
  "truth.rain.recheck": (p: { run: string }) => `The newest frame was also checked against IMERG ${p.run} and passed.`,
  "truth.rain.plotAlt":
    "Scatter plot: rain rate read from the EIC frame against NASA IMERG at the same points, on logarithmic axes.",
  "truth.checkedOn": (p: { datetime: string }) => `Checked ${p.datetime} UTC`,
  "truth.rain.plotCaption": (p: { run: string; points: number }) =>
    `The check above, plotted (IMERG ${p.run} run, ${formatInteger(p.points, "en")} points).`,

  // GLOBE duet teaser (contract §12; plan §16 "GLOBE (teaser)" wording is the heading line).
  "globe.teaser": "Teaser: coming in October",
  "globe.plan": "Citizen observers vs satellite: two perspectives, not right vs wrong.",
  "globe.featured": (p: { date: string; lat: number; lon: number; ground: number; satellite: number; reports: number }) =>
    `A typical day: on ${p.date} near ${formatFixed(p.lat, "en", 2)}° N, ${formatFixed(p.lon, "en", 2)}° E, observers on the ground ` +
    `reported about ${formatInteger(p.ground, "en")}% cloud cover (${formatInteger(p.reports, "en")} reports); the satellite measured ${formatInteger(p.satellite, "en")}%.`,
  "globe.summary": (p: { placeDays: number; median: number; within: number }) =>
    `Across ${formatInteger(p.placeDays, "en")} place-days in Bangladesh, the two typically differ by ${formatInteger(p.median, "en")} points, ` +
    `and are within 25 points of each other on ${formatInteger(p.within, "en")}% of them.`,

  "mapping.intro": "Every sound follows a written rule. The same numbers drive the sound engine, so this page and the sound can't disagree.",
  "mapping.live": "What you hear on the map",
  "mapping.global": "Rules for every sound",
  "mapping.designChoice": "Our design choice, to be tested with listeners",
  "mapping.silence": "Silence",
  "mapping.source": "Data",
  "mapping.hearLegend": "Hear the legend",
  "mapping.status.verified": "Checked against the source",
  "mapping.status.context": "Context record",
  "mapping.status.designOnly": "Sound cue",

  "provenance.at": (p: { place: string }) => `Where the value at ${p.place} comes from.`,
  "provenance.value": "Value",
  "provenance.dataset": "Dataset",
  "provenance.visualization": "Visualization",
  "provenance.svs": (p: { id: number }) => `NASA SVS ${p.id}`,
  "provenance.frameTime": "Frame time",
  "provenance.utc": (p: { datetime: string }) => `${p.datetime} UTC`,
  "provenance.check": "Check",
  "provenance.checkIsToday": (p: { datetime: string }) =>
    `This check is for today's frame (${p.datetime} UTC), not the time-lapse frame shown.`,
};
