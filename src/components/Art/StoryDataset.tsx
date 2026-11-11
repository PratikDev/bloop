"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { loadSequenceIndex } from "@/lib/data";
import { FLAGS } from "@/lib/flags";
import { formatUtc, type BoundT, type Lang } from "@/lib/i18n";
import type { RainField, SstField } from "@/lib/data";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";
import { useStory, type StoryStepId } from "../Story/use-story";

interface Sources {
  sst: SstField | null;
  rain: RainField | null;
  storm: { credit: string; first: string; last: string } | null;
}

/** The dataset and period a tour step plays (gap #7: named on every step, as the whisper step does), from the files. */
function stepDataset(t: BoundT, lang: Lang, step: StoryStepId, s: Sources): string | null {
  const sst = s.sst && t("tour.data", { source: s.sst.meta.source_dataset, period: formatUtc(s.sst.meta.frame_time_utc, lang) });
  const rain = s.rain && t("tour.data", { source: s.rain.meta.source_dataset, period: formatUtc(s.rain.meta.frame_time_utc, lang) });
  switch (step) {
    case "hum":
      return sst;
    case "sweep":
      return [sst, rain].filter(Boolean).join(" ") || null;
    case "storm":
      return s.storm && t("tour.dataSpan", { source: s.storm.credit, from: formatUtc(s.storm.first, lang), to: formatUtc(s.storm.last, lang) });
    case "whisper":
    case "truth":
      return rain ?? sst;
    case "xray":
      return null;
  }
}

/** Under the tour's line: "Data: …, frame …" for the step now playing (visible and read in browse mode). */
export function StoryDataset() {
  const { state } = useAppState();
  const t = useT();
  const story = useStory();
  const { sst, rain } = useLiveData();
  const { value: index } = useLoaded(loadSequenceIndex, FLAGS.artChoices);
  if (!FLAGS.artChoices || !story.step) return null;
  const frames = index?.frames ?? [];
  const storm = frames.length ? { credit: index?.credit ?? "", first: frames[0].time_utc, last: frames[frames.length - 1].time_utc } : null;
  const text = stepDataset(t, state.lang, story.step, { sst, rain, storm });
  return text ? (
    <p className="text-small text-haze" data-testid="tour-dataset" data-step={story.step}>
      {text}
    </p>
  ) : null;
}
