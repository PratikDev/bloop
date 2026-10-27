"use client";

import { useTT } from "../../Turntable/i18n";
import { SceneLoading } from "../SceneShell/SceneLoading";
import type { SceneProps } from "../types";
import { TerrainView } from "./TerrainView";
import { useTerrainData } from "./use-terrain-data";

/** Scene 3 (book 3D-7): the Bay of Bengal's sea temperature as a landscape you walk and hear. */
export function SoundTerrain({ onExit, tier, geo }: SceneProps) {
  const { tt } = useTT();
  const { data, error } = useTerrainData();
  if (!data) return <SceneLoading title={tt("scenes.terrain.title")} how={tt("scenes.terrain.how")} error={error} onExit={onExit} />;
  return <TerrainView data={data} onExit={onExit} tier={tier} geo={geo} />;
}
