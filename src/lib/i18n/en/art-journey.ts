// Water's journey (docs/statement/ART.md, Tier 2). Braille rules apply.

export const journeyEn = {
  "journey.open": "Water's journey",
  "journey.title": "Water's journey: a Bangladesh suite",
  "journey.lead":
    "Lightning, an atmospheric river, the rain over Bangladesh, the water stored under it, and the Bay of Bengal: five records, each in its Earth Orchestra family, with the dial at Music (the data voice unchanged) and two seconds of silence between them.",
  "journey.play": "Play the suite",
  "journey.stop": "Stop",
  "journey.close": "Close the suite",
  "journey.wav": "Play as one piece (save a WAV)",
  "journey.wavDone": (p: { seconds: string; id: string }) => `Saved: ${p.seconds} seconds, fingerprint ${p.id}.`,
  "journey.rendering": "Rendering the suite",
  "journey.loading": "Loading the five records",
  "journey.step.lightning": "Lightning",
  "journey.step.river": "An atmospheric river",
  "journey.step.rain": "Rain over Bangladesh",
  "journey.step.water": "Water stored under Bangladesh",
  "journey.step.sea": "The Bay of Bengal",
  "journey.status.pattern only": "pattern only, no values",
  "journey.status.relative": "relative values",
  "journey.status.verified": "values checked against NASA's files",
  "journey.status.observation": "observed values",
  "journey.line": (p: { name: string; dataset: string; period: string; status: string }) => `${p.name}. ${p.dataset}; ${p.period}; ${p.status}.`,
  "journey.dial": "Dial at Music: the data voice unchanged; what changes is the instrument, a drone on Sa, swara and meend glides and light reverb. Interpretation, not measurement.",
  "journey.season": "Artistic choice: season colour (monsoon).",
};
