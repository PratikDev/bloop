// Track 0 "Tuning": what each step says and plays. The anchors and the
// reference come from mapping.json (the values the sound is built from), the provenance lines from each frame's
// metadata and the registry. One sound per step, after its words, so speech and tone never overlap.
import { audio } from "@/lib/audio-adapter";
import type { PlayerHandle } from "@/lib/audio-adapter/types";
import { anchorPoint, referenceValue } from "@/lib/audio/mapping";
import { formatAxis, type BoundT, type Lang } from "@/lib/i18n";
import { sourceDataset } from "@/lib/provenance/live";
import { provenanceLine } from "@/lib/provenance/spoken";
import type { FreshnessFile, RainMetadata, SstMetadata } from "@/types/data-contract";

export interface TuningStep {
  id: string;
  /** The words, as shown and as said. */
  text(t: BoundT, lang: Lang): string;
  /** The step's sound, or null for words only. */
  play: (() => PlayerHandle | null) | null;
}

export interface TuningSources {
  freshness: FreshnessFile | null;
  sst: SstMetadata | null;
  rain: RainMetadata | null;
}

/** An anchor's value, as a slot (mapping.json writes them exactly: 0, 30, 0.5, 25). */
const anchor = (voice: string, which: "lowest" | "highest", lang: Lang) => formatAxis(anchorPoint(voice, which)?.value ?? Number.NaN, lang);

export function tuningSteps({ freshness, sst, rain }: TuningSources): TuningStep[] {
  const steps: (TuningStep | null)[] = [
    { id: "intro", text: (t) => t("tuning.intro"), play: null },
    {
      id: "reference",
      text: (t, lang) => t("tuning.reference", { value: formatAxis(referenceValue(), lang) }),
      play: () => audio.playAnchor("ocean", "reference"),
    },
    { id: "oceanLow", text: (t, lang) => t("tuning.oceanLow", { value: anchor("ocean", "lowest", lang) }), play: () => audio.playAnchor("ocean", "lowest") },
    { id: "oceanHigh", text: (t, lang) => t("tuning.oceanHigh", { value: anchor("ocean", "highest", lang) }), play: () => audio.playAnchor("ocean", "highest") },
    sst && sourceDataset(freshness, "sst") ? { id: "oceanSource", text: (t, lang) => provenanceLine(t, lang, freshness, "sst", sst) ?? "", play: null } : null,
    { id: "rainLow", text: (t, lang) => t("tuning.rainLow", { value: anchor("rain", "lowest", lang) }), play: () => audio.playAnchor("rain", "lowest") },
    { id: "rainHigh", text: (t, lang) => t("tuning.rainHigh", { value: anchor("rain", "highest", lang) }), play: () => audio.playAnchor("rain", "highest") },
    { id: "snow", text: (t, lang) => t("tuning.snow", { value: anchor("snow", "highest", lang) }), play: () => audio.playAnchor("snow", "highest") },
    rain && sourceDataset(freshness, "rain") ? { id: "rainSource", text: (t, lang) => provenanceLine(t, lang, freshness, "rain", rain) ?? "", play: null } : null,
    {
      id: "nodata",
      text: (t) => t("tuning.nodata"),
      play: () => {
        audio.playEarcon("nodata");
        return null;
      },
    },
    { id: "grammar", text: (t) => t("tuning.grammar"), play: null },
    { id: "done", text: (t) => t("tuning.done"), play: null },
  ];
  // A source line the registry can't give is left out, never said empty.
  return steps.filter((s): s is TuningStep => s !== null);
}
