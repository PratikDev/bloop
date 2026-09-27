// English strings for the side sheet: Truth, Mapping, Provenance, History.

import { formatInteger } from "../format";

export const panelsEn = {
  "panel.label": "About this sound",
  "panel.truth": "Truth",
  "panel.mapping": "Mapping",
  "panel.provenance": "Provenance",
  "panel.history": "History",

  "truth.intro": "We read each value back from the frame's colours, then checked those values against NASA's source data.",
  "truth.ocean.heading": "Ocean temperature",
  "truth.ocean.updating": "Verification being updated",
  "truth.ocean.updatingNote":
    "The ocean colorbar was recalibrated, and the new error is waiting for a check on a separate frame before we show it.",
  "truth.rain.heading": "Rain",
  // Built from rain.json's numbers until the team approves new §16 wording
  // (docs/L3/contract-proposals.md §A2).
  "truth.rain.sentence": (p: { run: string; percent: number; points: number; oneFrame: boolean; allAgreed: boolean; agreedPct: number }) =>
    `Checked against NASA IMERG (${p.run} run): typically within ~${formatInteger(p.percent, "en")}% ` +
    `(${formatInteger(p.points, "en")} rain points${p.oneFrame ? ", one frame" : ""}); ` +
    (p.allAgreed
      ? "agreed on where it was raining at every sampled point."
      : `agreed on where it was raining at ${formatInteger(p.agreedPct, "en")}% of sampled points.`),
  "truth.rain.plotAlt":
    "Scatter plot: rain rate read from the EIC frame against NASA IMERG at the same points, on logarithmic axes.",
  "truth.checkedOn": (p: { datetime: string }) => `Checked ${p.datetime} UTC`,
  "truth.rain.plotCaption": (p: { run: string; points: number }) =>
    `Plot from the first check (IMERG ${p.run} run, ${formatInteger(p.points, "en")} points), not today's re-check.`,

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

  "provenance.notReady": "Provenance for the current point is not ready yet.",
};
