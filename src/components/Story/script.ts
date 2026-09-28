// Story Mode (plan C3): ocean hum → sweep from Chattogram over the Bay of
// Bengal → storm time-lapse → satellite whisper → (X-ray, skipped) → truth.
// Every number said comes from L1's data files; the strings only take params.

import { abortable, sleep } from "@/lib/abortable";
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { loadSequenceIndex, spanHours, START_CURSOR, SWEEP_CENTER, valueAt, type LatLon, type LiveFields } from "@/lib/data";
import { formatInteger, formatUtc, type BoundT } from "@/lib/i18n";
import { readAt, readingFromPoint, spokenValue } from "@/lib/reading";
import { rainTruth } from "@/lib/truth";
import { whisperSource, type WhisperSource } from "@/lib/whisper";
import type { Line } from "../Commands/use-commands";
import type { TimeLapseRun } from "../TimeLapse/use-time-lapse";
import type { StoryFocus, StoryStepId } from "./use-story";

export const STORY_STEPS: readonly StoryStepId[] = ["hum", "sweep", "storm", "whisper", "xray", "truth"];
/** X-ray waits for L1's colorbar data (contract-proposals C1). */
export const SKIPPED_STEPS: ReadonlySet<StoryStepId> = new Set(["xray"]);

// Pauses that let a sound be heard on its own (design choices).
const HUM_HOLD_MS = 2500;
const WHISPER_HOLD_MS = 1500;
// The storm step plays only this many frames, centred on the heaviest one, to keep the
// tour under 90 s (design choice). Explore's time-lapse still plays every frame.
const STORM_FRAMES = 24;

export interface StoryDeps {
  signal: AbortSignal;
  t: BoundT; // the screen language (whisper captions)
  soundOn: boolean;
  fields(): LiveFields; // read at each step: rain may load during the story
  enterStep(step: StoryStepId, focus: StoryFocus): void;
  say(line: Line, source?: WhisperSource | null): Promise<void>; // shows, then speaks or announces
  startSweep(): PlayerHandle | null;
  playStorm(framesAroundPeak: number): Promise<TimeLapseRun>;
  openTruth(): void;
}

export async function runStory(d: StoryDeps): Promise<void> {
  const { signal, t } = d;
  const wait = <T>(p: Promise<T>) => abortable(p, signal);
  const say = (line: Line, source?: WhisperSource | null) => wait(d.say(line, source));

  // 1. Ocean hum: today's ocean value over the northern Bay of Bengal, held.
  const hum: LatLon = START_CURSOR;
  d.enterStep("hum", { point: hum, track: "ocean" });
  if (d.soundOn) {
    audio.setTrackMode("ocean");
    audio.setOcean(valueAt(d.fields(), "ocean", hum.lat, hum.lon).valueC, hum.lon);
  }
  const humReading = readAt(d.fields(), hum);
  await say((tl) => tl("story.hum", { reading: spokenValue(tl, humReading, "ocean") }));
  await sleep(HUM_HOLD_MS, signal);
  audio.silenceLive();

  // 2. Sweep: rings out from Chattogram, ocean and rain.
  const sweepTrack = d.fields().rain ? "both" : "ocean";
  d.enterStep("sweep", { point: SWEEP_CENTER, track: sweepTrack });
  await say((tl) => tl(d.soundOn ? "story.sweep" : "story.sweepNoSound"));
  if (d.soundOn) {
    audio.setTrackMode(sweepTrack);
    const sweep = d.startSweep();
    if (sweep) await wait(sweep.done);
  }

  // 3. Storm time-lapse, then its heaviest frame, in words.
  d.enterStep("storm", { point: SWEEP_CENTER, track: "rain" });
  // The span said comes from index.json (frames × step_minutes); without it, the line leaves the span out.
  const hours = await wait(loadSequenceIndex().then((index) => spanHours(index, STORM_FRAMES), () => null));
  await say((tl, lang) => (hours === null ? tl("story.stormNoSpan") : tl("story.storm", { hours: formatInteger(hours, lang) })));
  const run = await wait(d.playStorm(STORM_FRAMES));
  if (run.peak) {
    const { point, timeUtc } = run.peak;
    await say((tl, lang) =>
      tl("story.stormPeak", { reading: spokenValue(tl, readingFromPoint(point), "rain"), datetime: formatUtc(timeUtc, lang) }),
    );
  } else {
    await say((tl) => tl("story.stormFailed"));
  }

  // 4. Satellite whisper: today's value where the storm ended, then the chime naming its source.
  const fields = d.fields();
  const track = fields.rain ? "rain" : "ocean";
  const at: LatLon = fields.rain ? (run.last ?? SWEEP_CENTER) : hum;
  d.enterStep("whisper", { point: at, track });
  const now = readAt(fields, at);
  await say((tl) => tl("story.whisper", { reading: spokenValue(tl, now, track) }), whisperSource(t, fields, track));
  await sleep(WHISPER_HOLD_MS, signal);

  // 5. X-ray: said to be not ready, never faked.
  d.enterStep("xray", { point: at, track });
  await say((tl) => tl("story.xraySkipped"));

  // 6. Truth: the rain check, worded from rain.json (Pending team approval, shown in the panel).
  d.enterStep("truth", { point: at, track });
  d.openTruth();
  const rain = d.fields().rain;
  await say((tl) => (rain ? tl("story.truth", { sentence: tl("truth.rain.sentence", rainTruth(rain.meta)) }) : tl("story.truthLoading")));
  await say((tl) => tl("story.end", { close: tl("story.backToExplore") }));
}
