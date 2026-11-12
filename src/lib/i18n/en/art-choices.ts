// What is data, what is our artistic choice (gap #4). Braille rules apply.

export const choicesEn = {
  "choices.fromData": "From the data:",
  "choices.ourChoice": "Our artistic choice:",
  "choices.data.pitch": (p: { unit: string }) => `pitch follows the value (${p.unit})`,
  "choices.data.rate": (p: { unit: string }) => `how often it sounds follows the value (${p.unit})`,
  "choices.data.brightness": (p: { unit: string }) => `brightness follows the value (${p.unit})`,
  "choices.data.loudness": (p: { unit: string }) => `strength follows the value (${p.unit})`,
  "choices.data.echo": (p: { unit: string }) => `echo length follows the value (${p.unit})`,
  "choices.data.silence": "silence means no data",
  "choices.data.none": "no value drives this sound",
  "choices.range": (p: { min: string; max: string; unit: string; scale: string }) => `the range, ${p.min} to ${p.max} ${p.unit}, ${p.scale}`,
  "choices.scale.exponential": "exponential",
  "choices.scale.linear": "linear",
  "choices.timbre": (p: { instrument: string }) => `the instrument: ${p.instrument}`,
  "choices.legend": "the legend's points",
  "choices.dial": (p: { stop: string; list: string }) => `the dial at ${p.stop}: ${p.list}`,
};
