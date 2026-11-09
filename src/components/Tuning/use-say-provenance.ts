"use client";

import { useFreshness } from "@/hooks/use-freshness";
import { provenanceLine } from "@/lib/provenance/spoken";
import { useCommands } from "../Commands/use-commands";
import { useLiveData } from "../LiveData/use-live-data";
import { useShownPoint } from "../TimeLapse/use-shown-point";

/**
 * Shift+P on the map (accessibility core, step 5): says each shown record's provenance line (product, resolution,
 * date, observation or model) through the speech mode. A held time-lapse frame is rain, so only rain's line is said.
 */
export function useSayProvenance(): () => void {
  const commands = useCommands();
  const freshness = useFreshness();
  const { sst, rain } = useLiveData();
  const { track, timelapse } = useShownPoint();
  return () =>
    void commands.say((t, lang) =>
      [
        track !== "rain" && !timelapse && sst ? provenanceLine(t, lang, freshness, "sst", sst.meta) : null,
        track !== "ocean" && rain ? provenanceLine(t, lang, freshness, "rain", rain.meta) : null,
      ]
        .filter((line) => line !== null)
        .join(" "),
    );
}
