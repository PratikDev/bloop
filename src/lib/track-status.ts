// What the live region says when the track changes: "Now hearing: Ocean temperature." or, for Both, the frame gap
// too ("Now hearing: Both. Frames rain 2d newer."). One function for the command that changes the
// track and the map's reading announcement that follows it, so the status is never lost under the reading.

import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LiveFields } from "@/lib/data";
import { frameGap, gapShort, type FrameGap } from "@/lib/frame-gap";
import type { BoundT } from "@/lib/i18n";

export const trackName = (t: BoundT, track: TrackMode) =>
  t(track === "ocean" ? "track.oceanLong" : track === "rain" ? "track.rainLong" : "track.both");

/** Both mode's gap from the live frames' manifests (null: not Both, or no rain frame). */
export function liveGap(track: TrackMode, fields: LiveFields | null): FrameGap | null {
  return track === "both" && fields?.rain ? frameGap(fields.sst.meta.frame_time_utc, fields.rain.meta.frame_time_utc) : null;
}

export function trackStatus(t: BoundT, track: TrackMode, fields: LiveFields | null): string {
  const gap = liveGap(track, fields);
  return gap ? t("announce.trackBoth", { gap: gapShort(t, gap) }) : t("announce.track", { track: trackName(t, track) });
}
