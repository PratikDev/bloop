// Satellite whisper (plan C7): after a spoken value, a soft chime and a caption
// naming the mission and dataset. Every name comes from the frame's metadata.

import type { TrackMode } from "@/lib/audio-adapter/types";
import type { LiveFields } from "@/lib/data";
import type { BoundT } from "@/lib/i18n";

/** What the whisper names: a short caption, and the full dataset name(s). */
export interface WhisperSource {
  caption: string; // "measured by NASA and JAXA's GPM satellites (IMERG, Early run)"
  full: string; // "GPM IMERG half-hourly V07 (NASA/JAXA, GES DISC), Early run"
}

/** The dataset as the metadata names it, without L1's notes after a colon. */
export function datasetName(meta: { source_dataset: string }): string {
  return meta.source_dataset.split(":")[0].trim();
}

// "GPM IMERG half-hourly V07 (NASA/JAXA, GES DISC)": name, then agencies in brackets.
const DATASET = /^(\S+)(?:\s+(\S+))?[^(]*\(([^,)]+)/;
const MISSION = /^[A-Z]+$/; // an all-capitals first word is the mission ("GPM")

/** Mission-first wording, parsed from the dataset name; the full name if it doesn't parse. */
function captionFor(t: BoundT, dataset: string, run: string | null): string {
  const m = DATASET.exec(dataset);
  if (!m) return run ? t("whisper.withRun", { dataset, run }) : dataset;
  const [, first, second, agencyText] = m;
  const agencies = agencyText.trim().split("/").join(t("whisper.and"));
  if (second && MISSION.test(first)) return t("whisper.mission", { agencies, mission: first, product: second, run });
  return t("whisper.product", { agencies, product: first.split("-")[0], run });
}

/** Where the value just spoken comes from, for the current track. null = nothing to name. */
export function whisperSource(t: BoundT, fields: LiveFields, track: TrackMode): WhisperSource | null {
  const parts: WhisperSource[] = [];
  if (track !== "rain") {
    const dataset = datasetName(fields.sst.meta);
    parts.push({ caption: captionFor(t, dataset, null), full: dataset });
  }
  if (track !== "ocean" && fields.rain) {
    // Rain names the IMERG run L1 checked today's frame against.
    const run = fields.rain.meta.latest_check?.imerg_run ?? null;
    const dataset = datasetName(fields.rain.meta);
    parts.push({ caption: captionFor(t, dataset, run), full: run ? t("whisper.withRun", { dataset, run }) : dataset });
  }
  if (parts.length === 0) return null;
  return { caption: parts.map((p) => p.caption).join("; "), full: parts.map((p) => p.full).join("; ") };
}
