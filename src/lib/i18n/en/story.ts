// English strings for Story Mode (plan C3). Numbers are never written here:
// they arrive as params, read from L1's data files.

export const storyEn = {
  "story.heading": "Story",
  "story.step.hum": "Ocean hum",
  "story.step.sweep": "Sweep from Chattogram",
  "story.step.storm": "Storm time-lapse",
  "story.step.whisper": "Satellite whisper",
  "story.step.xray": "X-ray",
  "story.step.truth": "How we know",
  "story.stop": "Stop story",
  "story.replay": "Play again",
  "story.backToExplore": "Back to Explore",
  "story.source": (p: { source: string }) => `Data: ${p.source}`,
  "story.stopped": "Story stopped. Back to Explore.",

  "story.hum": (p: { reading: string }) => `Listen: the northern Bay of Bengal in today's NASA frame. ${p.reading}.`,
  "story.sweep": "Now a sweep from Chattogram across the Bay. Warmer water sounds higher; rain sounds as drops.",
  "story.sweepNoSound": "The sweep from Chattogram is a sound. Turn sound on to hear it.",
  "story.storm": (p: { hours: string }) => `${p.hours} hours of rain around the heaviest storm, half an hour per frame.`,
  "story.stormNoSpan": "Rain around the heaviest storm, half an hour per frame.",
  "story.stormPeak": (p: { reading: string; datetime: string }) => `Heaviest on its path: ${p.reading}, ${p.datetime} UTC.`,
  "story.stormFailed": "The storm frames couldn't load, so this step is skipped.",
  "story.whisper": (p: { reading: string }) => `Where the storm is now: ${p.reading}.`,
  "story.xraySkipped": "X-ray is coming in October: it waits for NASA's colorbar data.",
  "story.truth": (p: { sentence: string }) => `How do we know? ${p.sentence}`,
  "story.truthLoading": "The rain check appears in the Truth panel once rain has loaded.",
  "story.end": "That's the story. Press Escape to explore.",
};
