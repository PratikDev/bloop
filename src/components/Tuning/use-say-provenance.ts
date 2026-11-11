"use client";

import { useFreshness } from "@/hooks/use-freshness";
import { fitLine } from "@/a11y/brailleLines";
import { provenanceShort } from "@/a11y/shortForms";
import type { Lang } from "@/lib/i18n";
import { sourceDataset } from "@/lib/provenance/live";
import { provenanceLine } from "@/lib/provenance/spoken";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";

export function useSayProvenance(): () => void {
  const commands = useCommands();
  const freshness = useFreshness();
  const { sst, rain } = useLiveData();
  const { track, timelapse } = useShownPoint();
  const ocean = track !== "rain" && !timelapse && sst ? sst.meta : null;
  const wet = track !== "ocean" && rain ? rain.meta : null;
  const short = (lang: Lang) => {
    const shown = [["ocean", "sst", ocean], ["rain", "rain", wet]] as const;
    const lines = shown.flatMap(([record, product, meta]) => {
      const source = meta ? sourceDataset(freshness, product) : null;
      return meta && source ? [provenanceShort(lang, record, source, meta)] : [];
    });
    return lines.length ? fitLine([lines[0]], lines.slice(1)) : "";
  };
  return () =>
    void commands.say(
      (t, lang) =>
        [ocean ? provenanceLine(t, lang, freshness, "sst", ocean) : null, wet ? provenanceLine(t, lang, freshness, "rain", wet) : null]
          .filter((line) => line !== null)
          .join(" "),
      null,
      (_t, lang) => short(lang),
    );
}
