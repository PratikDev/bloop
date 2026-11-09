// §15 energy: Black Marble night lights (VJ146A2, NOAA-20).

import type { ProductHeader } from "./common";

export interface NightLightsCity {
  lat: number;
  lon: number;
  tile: string;
  days: string[];
  radiance: (number | null)[]; // nW·cm⁻²·sr⁻¹; null = cloud-masked ("clouds, not blackouts")
  valid_share: number[];
  cloud_masked: boolean[];
}

export interface NightLightsFile extends ProductHeader {
  short_name: string;
  variable: string;
  units: string;
  window_px: number;
  quality_rule: string;
  cities: Record<string, NightLightsCity>;
}
