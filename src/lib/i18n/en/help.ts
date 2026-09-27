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
  "key.x.action": "X-ray: how a colour becomes a number and a sound",
  "key.h.action": "Open this help",
  "key.esc": "Esc",
  "key.esc.action": "Stop all sound and close panels",
};
