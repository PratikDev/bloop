// iPhone: Web Audio is silent while the ringer (silent) switch is on, unless
// the page asks for a "playback" audio session (Safari 16.4+, W3C Audio
// Session draft). Browsers without it are unchanged. Untested on a real iPhone.

/** The Audio Session API; not in TypeScript's DOM types yet. */
interface AudioSession {
  type: "auto" | "playback" | "transient" | "transient-solo" | "ambient" | "play-and-record";
}

export function preferPlaybackSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSession }).audioSession;
  if (session) session.type = "playback";
}
