// Every playable thing in Bloop, in one list: its code, its names, its group and what it does. The rack, the mini
// player, the crowns and code entry all read this list. Codes are how you pick a record; C codes come from the
// official list by position, so they are never written by hand.

import { isFieldPart, VIEW_PARTS, type ViewPart } from "@/components/ThenNow/parts";
import type { Mode } from "@/components/AppState/reducer";
import type { TrackMode } from "@/lib/audio-adapter/types";
import type { BoundT } from "@/lib/i18n";
import type { OfficialIndexRow } from "@/types/contract-15/official";

export const RECORD_GROUPS = ["A", "B", "C", "D"] as const;
export type RecordGroup = (typeof RECORD_GROUPS)[number];

export type RecordAction =
  | { kind: "legend" }
  | { kind: "track"; track: TrackMode }
  | { kind: "thenNow"; part: ViewPart }
  | { kind: "official"; record: string }
  | { kind: "tour" }
  | { kind: "timeLapse" }
  | { kind: "sweep" };

type Text = (t: BoundT) => string;

export interface JukeboxRecord {
  code: string;
  group: RecordGroup;
  title: Text;
  subtitle?: Text;
  /** Only what is true: "Live", a real frame count, "Chart only". Never a made-up duration. */
  length?: Text;
  action: RecordAction;
}

const LIVE: Text = (t) => t("records.live");
const CHART_ONLY: Text = (t) => t("records.chartOnly");

const LIVE_RECORDS: readonly JukeboxRecord[] = [
  { code: "A0", group: "A", title: (t) => t("records.legend.title"), subtitle: (t) => t("records.legend.subtitle"), action: { kind: "legend" } },
  { code: "A1", group: "A", title: (t) => t("track.oceanLong"), length: LIVE, action: { kind: "track", track: "ocean" } },
  { code: "A2", group: "A", title: (t) => t("track.rainLong"), length: LIVE, action: { kind: "track", track: "rain" } },
  { code: "A3", group: "A", title: (t) => t("records.both.title"), length: LIVE, action: { kind: "track", track: "both" } },
];

const THEN_NOW_RECORDS: readonly JukeboxRecord[] = VIEW_PARTS.map((part, i) => ({
  code: `B${i + 1}`,
  group: "B",
  title: (t) => t(`thenNow.part.${part}`),
  length: isFieldPart(part) ? CHART_ONLY : undefined,
  action: { kind: "thenNow", part },
}));

const officialRecords = (rows: readonly OfficialIndexRow[]): JukeboxRecord[] =>
  rows.map((row, i) => ({
    code: `C${i + 1}`,
    group: "C",
    title: (t) => t("data.text", { text: row.title }),
    action: { kind: "official", record: row.record },
  }));

const guidedRecords = (frames: number | null): JukeboxRecord[] => [
  { code: "D1", group: "D", title: (t) => t("records.tour.title"), action: { kind: "tour" } },
  {
    code: "D2",
    group: "D",
    title: (t) => t("dock.label.timelapse"),
    // The count comes from the time-lapse's own index; until it has loaded, nothing is shown.
    length: frames === null ? undefined : (t) => t("records.frames", { count: frames }),
    action: { kind: "timeLapse" },
  },
  { code: "D3", group: "D", title: (t) => t("records.sweep.title"), action: { kind: "sweep" } },
];

/** The whole list, in rack order. `official` and `frames` are empty or null until their files load. */
export function buildRecords({ official, frames }: { official: readonly OfficialIndexRow[]; frames: number | null }): JukeboxRecord[] {
  return [...LIVE_RECORDS, ...THEN_NOW_RECORDS, ...officialRecords(official), ...guidedRecords(frames)];
}

/** Case-insensitive; spaces around the code don't matter. */
export function findByCode(records: readonly JukeboxRecord[], code: string): JukeboxRecord | undefined {
  const wanted = code.trim().toUpperCase();
  return records.find((r) => r.code === wanted);
}

/** The record before or after this one, inside its own group only; null at the group's ends. */
export function neighbour(records: readonly JukeboxRecord[], record: JukeboxRecord, step: 1 | -1): JukeboxRecord | null {
  const group = records.filter((r) => r.group === record.group);
  return group[group.indexOf(record) + step] ?? null;
}

export interface NowPlaying {
  mode: Mode;
  track: TrackMode;
  /** The time-lapse is loading or playing. */
  timeLapse: boolean;
  part?: ViewPart;
  official?: string;
}

/** Which record the app is on right now; null on Home, which has no record. */
export function currentRecord(records: readonly JukeboxRecord[], now: NowPlaying): JukeboxRecord | null {
  const find = (match: (a: RecordAction) => boolean) => records.find((r) => match(r.action)) ?? null;
  switch (now.mode) {
    case "home":
      return null;
    case "story":
      return find((a) => a.kind === "tour");
    case "thenNow": {
      const part = now.part ?? VIEW_PARTS[0];
      return find((a) => a.kind === "thenNow" && a.part === part);
    }
    case "official":
      return find((a) => a.kind === "official" && a.record === now.official) ?? find((a) => a.kind === "official");
    default:
      if (now.timeLapse) return find((a) => a.kind === "timeLapse");
      return find((a) => a.kind === "track" && a.track === now.track);
  }
}
