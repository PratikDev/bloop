// iPhone: Web Audio is silent while the ringer (silent) switch is on, unless
// the page asks for a "playback" audio session (Safari 16.4+, W3C Audio
// Session draft). Browsers without the API are unchanged. Same behaviour as
// L3's interim engine (L3-interface ae286f1).

/** The Audio Session API; not in TypeScript's DOM types yet. */
interface AudioSession {
  type: "auto" | "playback" | "transient" | "transient-solo" | "ambient" | "play-and-record";
}

export function preferPlaybackSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSession }).audioSession;
  if (session && session.type !== "playback") session.type = "playback";
}
