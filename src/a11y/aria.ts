// ARIA 1.3's braille attributes, spread onto an element: aria-braillelabel is a short braille form of an
// accessible name that stays; aria-brailleroledescription the braille form of an aria-roledescription that
// stays (axe rule aria-braille-equivalent). A bonus for VoiceOver and JAWS, never the only route (NVDA
// ignores aria-braillelabel). Spread, because eslint-plugin-jsx-a11y's ARIA table predates ARIA 1.3.

export function brailleLabel(label: string | undefined): { "aria-braillelabel"?: string } {
  return label ? { "aria-braillelabel": label } : {};
}

export function brailleRole(role: string): { "aria-brailleroledescription": string } {
  return { "aria-brailleroledescription": role };
}
