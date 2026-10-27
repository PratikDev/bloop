// Scenes that need data the app doesn't ship yet (docs/3d-scenes-1-plan.md,
// "Not in this pack"). Typed hooks only: each stays null until its data is
// published (L1) and its voice is in mapping.json (L2); then it gets a
// component and joins SCENE_IDS in registry.ts.

import type { ComponentType } from "react";
import type { SceneProps } from "./types";

export const FUTURE_SCENES = [
  "amphanColdScar",
  "riverHeights",
  "twinGlobes",
  "satelliteOrrery",
  "forestOfLidars",
  "dhakaLightColumns",
  "coralGlass",
  "thunderTowers",
  "snowGlobeHazeDome",
  "seaLevelGlass",
  "mixingDesk",
] as const;
export type FutureScene = (typeof FUTURE_SCENES)[number];

export interface FutureSceneSpec {
  /** The datasets it needs (none of them ship today). */
  needs: readonly string[];
  /** The scene, once its data exists. */
  component: ComponentType<SceneProps> | null;
}

export const FUTURE_SCENE_SPECS: Record<FutureScene, FutureSceneSpec> = {
  amphanColdScar: { needs: ["MUR SST daily (May 2020)", "IBTrACS track for Amphan"], component: null },
  riverHeights: { needs: ["SWOT river heights (Padma, Jamuna, Meghna)"], component: null },
  twinGlobes: { needs: ["JAXA GSMaP precipitation"], component: null },
  satelliteOrrery: { needs: ["CelesTrak orbital elements (GPM, GRACE-FO, Terra, Aqua, SWOT)"], component: null },
  forestOfLidars: { needs: ["GEDI canopy height", "ICESat-2 ATL08", "CMS biomass"], component: null },
  dhakaLightColumns: { needs: ["Black Marble VNP46 night lights (time series)"], component: null },
  coralGlass: { needs: ["NOAA Coral Reef Watch degree heating weeks"], component: null },
  thunderTowers: { needs: ["LIS lightning flash rates"], component: null },
  snowGlobeHazeDome: { needs: ["Air quality: aerosol optical depth / PM2.5"], component: null },
  seaLevelGlass: { needs: ["NASA-SSH sea level", "PSMSL tide gauges"], component: null },
  mixingDesk: { needs: ["Several live layers at once (multi-layer mapping in mapping.json)"], component: null },
};
