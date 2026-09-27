"use client";

import type { TrackMode } from "@/lib/audio-adapter/types";
import { useAppState, useT } from "./AppState/use-app-state";
import { ChoiceGroup } from "./ChoiceGroup";
import { useCommands } from "./Commands/use-commands";

/** Ocean / Rain / Both (keys 1, 2, 3). */
export function TrackChoice({ className, itemClassName }: { className?: string; itemClassName?: string }) {
  const { state } = useAppState();
  const commands = useCommands();
  const t = useT();
  return (
    <ChoiceGroup<TrackMode>
      label={t("track.label")}
      value={state.track}
      onChange={commands.setTrack}
      options={[
        { value: "ocean", label: t("track.ocean") },
        { value: "rain", label: t("track.rain") },
        { value: "both", label: t("track.both") },
      ]}
      className={className}
      itemClassName={itemClassName}
    />
  );
}
