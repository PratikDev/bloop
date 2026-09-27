// English strings for the Help dialog: the keyboard map (plan §9.3).

import { PLACE_NAMES_EN } from "./places";

export const helpEn = {
  "help.title": "Keys and help",
  "help.focusNote":
    "Letter keys work while the sound map has focus, so they don't clash with screen reader keys. Esc works everywhere.",
  "help.voiceNote":
    "If you use a screen reader, you may prefer to turn off the built-in voice: the screen reader already reads values aloud.",
  "help.keyColumn": "Key",
  "help.actionColumn": "What it does",
  "key.arrows": "Arrow keys",
  "key.arrows.action": "Move the cursor 1 degree (with Shift: 10 degrees)",
  "key.enter.action": "Speak the value and the place",
  "key.space": "Space",
  "key.space.action": "Pause or resume the live sound",
  "key.s.action": `Play the sweep outward from ${PLACE_NAMES_EN.sweepCenter}`,
  "key.123.action": "Hear ocean, rain, or both",
  "key.m.action": "Mute or unmute everything",
  "key.d.action": "Describe mode on or off",
  "key.c.action": "Captions on or off",
  "key.t.action": "Then vs Now",
  "key.l.action": "Hear the legend (reference sounds)",
  "key.p.action": "Where this value comes from",
  "key.x.action": "X-ray: how a colour becomes a number and a sound (coming in October)",

  // Team plan §11.7 concept-only items, plus X-ray: shown with a "Coming in October" label.
  "october.heading": "Not built yet",
  "october.xray": "X-ray: how a colour becomes a number and a sound (waits for NASA's colorbar data)",
  "october.aiByEar": "\"Check the AI by ear\" and \"Ask the Earth\", a voice agent (the AI never produces numbers)",
  "october.study": "A listening study with blind and low-vision adults",
  "october.choirs": "The full Anomaly Choir and Change Choir",
  "october.passes": "Satellite-pass cues (\"who measured this?\")",
  "october.raga": "Raga music mode",
  "october.duets": "NASA vs JAXA (GSMaP) and NASA vs UK Met Office (OSTIA) duets",
  "october.tracks": "More EIC tracks: fires, air quality, wind",
  "october.kiosk": "Kiosk and hyperwall mode",
  "key.h.action": "Open this help",
  "key.esc": "Esc",
  "key.esc.action": "Stop all sound and close panels",
};
