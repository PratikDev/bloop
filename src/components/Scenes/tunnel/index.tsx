"use client";

import { useTT } from "../../Turntable/i18n";
import { SceneLoading } from "../SceneShell/SceneLoading";
import type { SceneProps } from "../types";
import { TunnelView } from "./TunnelView";
import { useTunnelData } from "./use-tunnel-data";

/** Scene 4 (book 3D-27 + 3D-12): Dhaka's years as rings you fly through, heat as colour and pitch, rain as beads and drops. */
export function TimeTunnel({ onExit, tier, geo }: SceneProps) {
  const { tt } = useTT();
  const { data, error } = useTunnelData();
  if (!data) return <SceneLoading title={tt("scenes.tunnel.title")} how={tt("scenes.tunnel.how")} error={error} onExit={onExit} />;
  return <TunnelView data={data} onExit={onExit} tier={tier} geo={geo} />;
}
