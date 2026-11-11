export const tuningEn = {
  "tuning.title": "Track 0: Tuning",
  "tuning.progress": (p: { n: string; total: string }) => `Step ${p.n} of ${p.total}`,
  "tuning.intro": "Before you explore, learn what the sounds mean, one at a time. Next plays each step; Skip ends tuning. Help can play it again.",
  "tuning.reference": (p: { value: string }) =>
    `The reference tone: ${p.value} degrees Celsius, the middle of the ocean scale. Set a volume that is comfortable.`,
  "tuning.oceanLow": (p: { value: string }) => `Ocean temperature, the lowest anchor: ${p.value} degrees Celsius. A low pitch.`,
  "tuning.oceanHigh": (p: { value: string }) => `Ocean temperature, the highest anchor: ${p.value} degrees Celsius. A high pitch.`,
  "tuning.rainLow": (p: { value: string }) => `Rain, the lowest anchor: ${p.value} millimetres an hour. Slow drops.`,
  "tuning.rainHigh": (p: { value: string }) => `Rain, the highest anchor: ${p.value} millimetres an hour. Fast drops.`,
  "tuning.snow": (p: { value: string }) => `Snow follows the same rule, as bells: ${p.value} millimetres an hour.`,
  "tuning.nodata": "Silence means no data: land, or no measurement. It never means zero. This tick marks where the data stops.",
  "tuning.grammar":
    "The sound grammar. Pitch is ocean temperature: higher is warmer. Rhythm is rain: faster drops are heavier rain, and bells are snow. Loudness carries no data, so set it to what is comfortable. Left and right follow longitude.",
  "tuning.done": "Tuning done. On the map, Enter says the value here, D describes the place, and H lists every key.",
  "tuning.next": "Next",
  "tuning.again": "Play again",
  "tuning.skip": "Skip tuning",
  "tuning.finish": "Start exploring",
  "tuning.replay": "Play Track 0 (Tuning) again",

  "provenance.line": (p: { dataset: string; agency: string; kind: string; deg: string; km: string; time: string }) =>
    `${p.dataset}: a ${p.agency} ${p.kind}. Cells ${p.deg} degrees across, about ${p.km} kilometres at the equator. This frame: ${p.time} UTC.`,
  "provenance.kind.measurement": "observation",
  "provenance.kind.model": "model",
  "provenance.kind.inventory": "inventory",
  "key.shiftP.action": "Say where this record comes from, in one line",
};
