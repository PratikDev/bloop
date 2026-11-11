// PURE: the storm time-lapse's timed text. One metadata cue per half-hourly frame (its own
// UTC time), a chapter each time the followed storm moves into another region, and DCMP-style captions when the drops
// begin, stop, turn to bells (snow) or fall silent (no data), at the heaviest frame, and at the end. Frame i starts at
// i × stepSec, as both engines schedule it.
import { peakFrame } from "@/lib/audio/storm-maths";
import type { SweepPoint } from "@/lib/audio/types";
import { evenSteps } from "@/lib/audio/players/steps";
import { formatInteger, formatUtc } from "@/lib/i18n";
import { chain } from "./vtt";
import { metadataCue, placeOf, rainNote, rainSlot, regionOf, UNIT, type TimedTracks, type TrackText } from "./tracks";

export interface TimelapseRun {
  frames: SweepPoint[];
  /** Each frame's time (UTC, ISO 8601). */
  times: string[];
  stepSec: number;
}

type Sound = "drops" | "bells" | "dry" | "nodata";

const soundOf = (f: SweepPoint): Sound =>
  f.phase === "nodata" || f.mmPerHour === null ? "nodata" : f.mmPerHour === 0 || f.phase === "dry" ? "dry" : f.phase === "frozen" ? "bells" : "drops";

const CHANGE = { drops: "tt.cap.dropsBegin", bells: "tt.cap.bellsBegin", dry: "tt.cap.dropsStop", nodata: "tt.cap.lapseNodata" } as const satisfies Record<Sound, string>;

export function timelapseTracks(run: TimelapseRun, x: TrackText): TimedTracks {
  const { frames, times, stepSec } = run;
  const at = evenSteps(frames.length, stepSec);
  const end = frames.length * stepSec;
  const time = (i: number) => formatUtc(times[i], x.lang);

  const metadata = frames.map((f, i) =>
    metadataCue(at[i], at[i] + stepSec, { time: times[i], lat: f.lat, lon: f.lon, place: placeOf(x, f), value: soundOf(f) === "nodata" ? null : f.mmPerHour, unit: UNIT.rain, note: rainNote(x, f) }),
  );

  const regions = frames.map((f) => regionOf(x, f));
  const chapters = chain(
    regions.flatMap((r, i) => (i === 0 || r !== regions[i - 1] ? [{ start: at[i], text: x.t("tt.chapter.region", { region: r, time: time(i) }) }] : [])),
    end,
  );

  const caps: { start: number; text: string }[] = [{ start: 0, text: x.t("tt.cap.lapseBegin", { count: formatInteger(frames.length, x.lang) }) }];
  const peak = peakFrame(frames);
  frames.forEach((f, i) => {
    const s = soundOf(f);
    if (i === peak && f.mmPerHour !== null) {
      caps.push({ start: at[i], text: x.t(f.phase === "frozen" ? "tt.cap.lapsePeakSnow" : "tt.cap.lapsePeak", { value: rainSlot(x, f.mmPerHour), place: placeOf(x, f), time: time(i) }) });
    } else if (i === 0 ? s !== "dry" : s !== soundOf(frames[i - 1])) {
      caps.push({ start: at[i], text: x.t(CHANGE[s], { place: placeOf(x, f) }) });
    }
  });
  caps.push({ start: end, text: x.t("tt.cap.lapseEnd") });
  return { metadata, chapters, captions: chain(caps, end + stepSec) };
}
