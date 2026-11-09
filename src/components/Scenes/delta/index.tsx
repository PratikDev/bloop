"use client";

import { useTT } from "../../Turntable/i18n";
import { SceneLoading } from "../SceneShell/SceneLoading";
import type { SceneProps } from "../types";
import { DeltaView } from "./DeltaView";
import { useDeltaData } from "./use-delta-data";

/** Scene 2 (book 3D-3 + 3D-11): Bangladesh's delta, its rain and the water underground, with NW India on the same scale. */
export function PlayableDelta({ onExit, tier, geo }: SceneProps) {
  const { tt } = useTT();
  const { data, error } = useDeltaData(geo);
  if (!data) return <SceneLoading title={tt("scenes.delta.title")} how={tt("scenes.delta.how")} error={error} onExit={onExit} />;
  return <DeltaView data={data} onExit={onExit} tier={tier} geo={geo} />;
}
